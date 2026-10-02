'use strict';
const client = require('./graphql-client');

const { ShopifyError, fromGid, toGid } = client;

// A list page carries up to 100 variants and 50 media per product. 50 products
// with that selection cost ~720 points, under the 1000-point single query cap,
// so list pages are capped at 50 (the pager follows the cursor for the rest).
const LIST_MAX_PAGE = 50;

// Media added by URL or upload is processed asynchronously; REST answered with
// the final image src, so wait a few seconds for processing to finish.
const MEDIA_WAIT_ATTEMPTS = 8;
const MEDIA_WAIT_MS = 1000;
const MEDIA_PENDING = ['UPLOADED', 'PROCESSING'];

const productFields = (variants, media) => `
    id title descriptionHtml vendor productType handle status tags publishedAt templateSuffix createdAt updatedAt
    seo { title description }
    options { id name position values }
    variants(first: ${variants}) {
        nodes {
            id title price compareAtPrice sku position inventoryPolicy inventoryQuantity taxable createdAt updatedAt
            barcodes(first: 1) { nodes { value } }
            selectedOptions { name value }
            inventoryItem { id tracked requiresShipping measurement { weight { unit value } } }
            media(first: 1) { nodes { id } }
        }
    }
    media(first: ${media}) {
        nodes {
            id alt mediaContentType status
            ... on MediaImage { createdAt updatedAt image { url width height } }
        }
    }`;

const PRODUCT_FIELDS = productFields(250, 250);
const LIST_PRODUCT_FIELDS = productFields(100, 50);

const GET_PRODUCT = `query GetProduct($id: ID!) {
    product(id: $id) { ${PRODUCT_FIELDS} }
}`;

const LIST_PRODUCTS = `query ListProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${LIST_PRODUCT_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const COUNT_PRODUCTS = `query CountProducts($query: String) {
    productsCount(query: $query, limit: null) { count }
}`;

const CREATE_PRODUCT = `mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
        product { ${PRODUCT_FIELDS} }
        userErrors { field message }
    }
}`;

const UPDATE_PRODUCT = `mutation UpdateProduct($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
    productUpdate(product: $product, media: $media) {
        product { ${PRODUCT_FIELDS} }
        userErrors { field message }
    }
}`;

const DELETE_PRODUCT = `mutation DeleteProduct($input: ProductDeleteInput!) {
    productDelete(input: $input) {
        deletedProductId
        userErrors { field message }
    }
}`;

const STAGED_UPLOAD = `mutation StagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
    }
}`;

// WeightUnit → REST weight_unit and grams per unit.
const WEIGHT_UNITS = {
    GRAMS: { unit: 'g', grams: 1 },
    KILOGRAMS: { unit: 'kg', grams: 1000 },
    OUNCES: { unit: 'oz', grams: 28.349523125 },
    POUNDS: { unit: 'lb', grams: 453.59237 }
};

// REST `order` field → ProductSortKeys.
const SORT_KEYS = {
    id: 'ID',
    created_at: 'CREATED_AT',
    updated_at: 'UPDATED_AT',
    published_at: 'PUBLISHED_AT',
    title: 'TITLE',
    vendor: 'VENDOR',
    product_type: 'PRODUCT_TYPE'
};

const nodes = connection => (connection && connection.nodes) || [];
const isSet = value => value !== undefined && value !== null && value !== '';

function toRestImage(media, position, productId, variantIds) {

    const image = media.image || {};
    return {
        id: fromGid(media.id),
        product_id: productId,
        position,
        alt: media.alt || null,
        width: image.width === undefined ? null : image.width,
        height: image.height === undefined ? null : image.height,
        src: image.url || null,
        variant_ids: variantIds,
        created_at: media.createdAt || null,
        updated_at: media.updatedAt || null,
        admin_graphql_api_id: media.id
    };
}

function toRestVariant(variant, productId, optionPositions) {

    const item = variant.inventoryItem || {};
    const weight = item.measurement && item.measurement.weight;
    const unit = weight && WEIGHT_UNITS[weight.unit];
    const barcode = nodes(variant.barcodes)[0];
    const image = nodes(variant.media)[0];

    const options = [null, null, null];
    (variant.selectedOptions || []).forEach(option => {
        const position = optionPositions[option.name];
        if (position >= 1 && position <= 3) {
            options[position - 1] = option.value;
        }
    });

    return {
        id: fromGid(variant.id),
        product_id: productId,
        title: variant.title,
        price: client.money({ amount: variant.price }),
        compare_at_price: client.money(isSet(variant.compareAtPrice) ? { amount: variant.compareAtPrice } : null),
        sku: variant.sku === undefined ? null : variant.sku,
        position: variant.position,
        inventory_policy: client.enumValue(variant.inventoryPolicy),
        inventory_quantity: variant.inventoryQuantity === undefined ? null : variant.inventoryQuantity,
        inventory_item_id: fromGid(item.id),
        inventory_management: item.tracked ? 'shopify' : null,
        barcode: barcode ? barcode.value : null,
        taxable: variant.taxable,
        requires_shipping: item.requiresShipping === undefined ? null : item.requiresShipping,
        grams: unit ? Math.round(weight.value * unit.grams) : null,
        weight: weight ? weight.value : null,
        weight_unit: unit ? unit.unit : null,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        image_id: image ? fromGid(image.id) : null,
        created_at: variant.createdAt,
        updated_at: variant.updatedAt,
        admin_graphql_api_id: variant.id
    };
}

/**
 * GraphQL Product → REST product object.
 * @param {object} product
 * @returns {object|null}
 */
function toRestProduct(product) {

    if (!product) return null;

    const id = fromGid(product.id);
    const variantNodes = nodes(product.variants);
    const optionPositions = {};
    (product.options || []).forEach(option => {
        optionPositions[option.name] = option.position;
    });

    // Which variants show which image (REST image.variant_ids).
    const variantsByMedia = {};
    variantNodes.forEach(variant => {
        nodes(variant.media).forEach(media => {
            (variantsByMedia[media.id] = variantsByMedia[media.id] || []).push(fromGid(variant.id));
        });
    });

    const images = nodes(product.media)
        .filter(media => media.mediaContentType === 'IMAGE')
        .map((media, index) => toRestImage(media, index + 1, id, variantsByMedia[media.id] || []));

    const seo = product.seo || {};

    return {
        id,
        title: product.title,
        body_html: product.descriptionHtml === undefined ? null : product.descriptionHtml,
        vendor: product.vendor,
        product_type: product.productType,
        handle: product.handle,
        status: client.enumValue(product.status),
        tags: client.tagString(product.tags),
        published_at: product.publishedAt || null,
        // Publication scope (web / global) needs the publications API, which
        // the connector has no scope for.
        published_scope: null,
        template_suffix: product.templateSuffix === undefined ? null : product.templateSuffix,
        metafields_global_title_tag: seo.title || null,
        metafields_global_description_tag: seo.description || null,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        admin_graphql_api_id: product.id,
        variants: variantNodes.map(variant => toRestVariant(variant, id, optionPositions)),
        options: (product.options || []).map(option => ({
            id: fromGid(option.id),
            product_id: id,
            name: option.name,
            position: option.position,
            values: option.values || []
        })),
        images,
        image: images[0] || null
    };
}

// GraphQL search syntax value: always quoted, so spaces, colons (dates) and
// quotes in user input cannot change the query.
function quote(value) {

    return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/**
 * REST list/count filters → products search query string (undefined if none).
 * @param {object} params
 * @returns {string|undefined}
 */
function toSearchQuery(params = {}) {

    const terms = [];

    if (isSet(params.ids)) {
        const ids = String(params.ids).split(',').map(id => id.trim()).filter(Boolean)
            .map(id => `id:${quote(fromGid(id))}`);
        if (ids.length) terms.push(ids.length > 1 ? `(${ids.join(' OR ')})` : ids[0]);
    }
    if (isSet(params.since_id)) {
        terms.push(`id:>${quote(fromGid(params.since_id))}`);
    }
    for (const field of ['title', 'vendor', 'product_type', 'handle', 'collection_id']) {
        if (isSet(params[field])) {
            const value = field === 'collection_id' ? fromGid(params[field]) : params[field];
            terms.push(`${field}:${quote(value)}`);
        }
    }
    if (isSet(params.status)) {
        const statuses = String(params.status).split(',').map(status => status.trim()).filter(Boolean)
            .map(status => `status:${quote(status.toLowerCase())}`);
        if (statuses.length) terms.push(statuses.length > 1 ? `(${statuses.join(' OR ')})` : statuses[0]);
    }
    for (const field of ['created_at', 'updated_at', 'published_at']) {
        if (isSet(params[`${field}_min`])) terms.push(`${field}:>=${quote(params[`${field}_min`])}`);
        if (isSet(params[`${field}_max`])) terms.push(`${field}:<=${quote(params[`${field}_max`])}`);
    }
    if (isSet(params.published_status) && params.published_status !== 'any') {
        terms.push(`published_status:${quote(params.published_status)}`);
    }

    return terms.length ? terms.join(' AND ') : undefined;
}

/**
 * REST `order` ("created_at DESC") → { sortKey, reverse }.
 * @param {string} order
 * @returns {object}
 */
function toSort(order) {

    if (!isSet(order)) return {};
    const [field, direction] = String(order).trim().split(/\s+/);
    const sortKey = SORT_KEYS[field.toLowerCase()];
    if (!sortKey) return {};
    return { sortKey, reverse: String(direction || '').toUpperCase() === 'DESC' };
}

function toStatus(payload) {

    if (isSet(payload.status)) return String(payload.status).toUpperCase();
    // REST `published` put the product on the Online Store. Publishing to a
    // sales channel needs the publications scope; the nearest equivalent the
    // connector can set is the product status.
    if (payload.published === true || payload.published === 'true') return 'ACTIVE';
    if (payload.published === false || payload.published === 'false') return 'DRAFT';
    return undefined;
}

/**
 * REST product payload → ProductCreateInput / ProductUpdateInput fields. Keys
 * left out of the payload stay out of the input.
 * @param {object} payload
 * @returns {object}
 */
function toProductInput(payload = {}) {

    const input = {};
    const map = {
        title: 'title', body_html: 'descriptionHtml', vendor: 'vendor', product_type: 'productType',
        handle: 'handle', template_suffix: 'templateSuffix'
    };
    for (const [key, target] of Object.entries(map)) {
        if (payload[key] !== undefined && payload[key] !== null) input[target] = payload[key];
    }
    const tags = client.tagList(payload.tags);
    if (tags) input.tags = tags;
    const status = toStatus(payload);
    if (status) input.status = status;
    const seo = {};
    if (isSet(payload.metafields_global_title_tag)) seo.title = payload.metafields_global_title_tag;
    if (isSet(payload.metafields_global_description_tag)) seo.description = payload.metafields_global_description_tag;
    if (Object.keys(seo).length) input.seo = seo;
    return input;
}

// Base64 image data → { buffer, mimeType, extension }. Accepts data URLs too.
function decodeAttachment(attachment) {

    const value = String(attachment);
    const dataUrl = value.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    const buffer = Buffer.from(dataUrl ? dataUrl[3] : value, 'base64');
    if (!buffer.length) {
        throw new ShopifyError('Image attachment is empty or not valid base64 data.', 422);
    }
    const hex = buffer.subarray(0, 12).toString('hex');
    const ascii = buffer.subarray(0, 12).toString('latin1');
    let type = ['image/jpeg', 'jpg'];
    if (hex.startsWith('89504e47')) type = ['image/png', 'png'];
    else if (ascii.startsWith('GIF8')) type = ['image/gif', 'gif'];
    else if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') type = ['image/webp', 'webp'];
    else if (dataUrl && dataUrl[1] && dataUrl[1].startsWith('image/')) type = [dataUrl[1], dataUrl[1].split('/')[1]];
    return { buffer, mimeType: type[0], extension: type[1] };
}

/**
 * Translate a REST product's not-found userError to a 404 (REST answered 404),
 * otherwise behave like checkUserErrors.
 */
function checkProductErrors(payload, name) {

    const userErrors = (payload && payload.userErrors) || [];
    const notFound = userErrors.find(error => /does not exist|not found/i.test(error.message || ''));
    if (notFound) {
        throw new ShopifyError(`${name} failed — ${notFound.message}`, 404, userErrors);
    }
    return client.checkUserErrors(payload, name);
}

/**
 * @param {function} run (query, variables) => Promise<data>
 * @param {object} [options]
 * @param {function} [options.putFile] (url, buffer, headers) => Promise — uploads
 *        a staged file; required for base64 `attachment` images.
 * @param {function} [options.sleep] (ms) => Promise, for tests.
 */
module.exports = (run, options = {}) => {

    const sleep = options.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));

    // `attachment` (base64) has no GraphQL input: stage an upload, PUT the
    // bytes there, then reference the staged resourceUrl as the media source.
    async function uploadAttachment(image) {

        if (typeof options.putFile !== 'function') {
            throw new ShopifyError('Image attachments (base64) need a file upload, which is not available here. Use an image URL (src) instead.', 422);
        }
        const { buffer, mimeType, extension } = decodeAttachment(image.attachment);
        const filename = image.filename || `image.${extension}`;
        const data = await run(STAGED_UPLOAD, {
            input: [{ resource: 'IMAGE', filename, mimeType, httpMethod: 'PUT', fileSize: String(buffer.length) }]
        });
        const payload = client.checkUserErrors(data.stagedUploadsCreate, 'stagedUploadsCreate');
        const target = payload.stagedTargets[0];
        // Only Content-Type is a signed header of the PUT target; sending the
        // other parameters (acl) as headers is rejected by the storage.
        await options.putFile(target.url, buffer, { 'Content-Type': mimeType });
        return target.resourceUrl;
    }

    // REST images[] → CreateMediaInput[] for images not on the product yet
    // (those without an id). Existing images are kept by productUpdate.
    async function toMediaInput(images) {

        if (!Array.isArray(images)) return undefined;
        const fresh = images
            .filter(image => image && !image.id && (isSet(image.src) || isSet(image.attachment)))
            .sort((a, b) => (Number(a.position) || Infinity) - (Number(b.position) || Infinity));
        const media = [];
        for (const image of fresh) {
            const originalSource = isSet(image.src) ? String(image.src) : await uploadAttachment(image);
            const item = { originalSource, mediaContentType: 'IMAGE' };
            if (isSet(image.alt)) item.alt = String(image.alt);
            media.push(item);
        }
        return media.length ? media : undefined;
    }

    async function fetchProduct(id) {

        const data = await run(GET_PRODUCT, { id: toGid('Product', id) });
        if (!data.product) {
            throw new ShopifyError('Not Found', 404);
        }
        return data.product;
    }

    async function waitForMedia(product) {

        let current = product;
        for (let attempt = 0; attempt < MEDIA_WAIT_ATTEMPTS; attempt++) {
            const pending = nodes(current.media).some(media => MEDIA_PENDING.includes(media.status));
            if (!pending) break;
            await sleep(MEDIA_WAIT_MS);
            current = await fetchProduct(current.id);
        }
        return current;
    }

    return {

        async list(params = {}) {

            const variables = {
                first: Math.min(client.pageSize(params.limit), LIST_MAX_PAGE),
                ...toSort(params.order)
            };
            if (!variables.sortKey && isSet(params.since_id)) variables.sortKey = 'ID';
            const query = toSearchQuery(params);
            if (query) variables.query = query;
            if (params.after) variables.after = params.after;

            const data = await run(LIST_PRODUCTS, variables);
            const connection = data.products || {};
            return client.toListResult(nodes(connection).map(toRestProduct), connection.pageInfo, params);
        },

        // `params.fields` (REST partial response) is ignored; the whole product is returned.
        async get(id) {

            return toRestProduct(await fetchProduct(id));
        },

        async count(params = {}) {

            const query = toSearchQuery(params);
            const data = await run(COUNT_PRODUCTS, query ? { query } : {});
            return data.productsCount ? data.productsCount.count : 0;
        },

        async create(payload = {}) {

            const variables = { product: toProductInput(payload) };
            const media = await toMediaInput(payload.images);
            if (media) variables.media = media;

            const data = await run(CREATE_PRODUCT, variables);
            const { product } = client.checkUserErrors(data.productCreate, 'productCreate');
            return toRestProduct(media ? await waitForMedia(product) : product);
        },

        async update(id, payload = {}) {

            const variables = { product: { ...toProductInput(payload), id: toGid('Product', id) } };
            const media = await toMediaInput(payload.images);
            if (media) variables.media = media;

            const data = await run(UPDATE_PRODUCT, variables);
            const { product } = checkProductErrors(data.productUpdate, 'productUpdate');
            return toRestProduct(media ? await waitForMedia(product) : product);
        },

        async delete(id) {

            const data = await run(DELETE_PRODUCT, { input: { id: toGid('Product', id) } });
            checkProductErrors(data.productDelete, 'productDelete');
            return {};
        }
    };
};

module.exports.toRestProduct = toRestProduct;
module.exports.toProductInput = toProductInput;
module.exports.toSearchQuery = toSearchQuery;
module.exports.toSort = toSort;
module.exports.decodeAttachment = decodeAttachment;
module.exports.queries = {
    GET_PRODUCT, LIST_PRODUCTS, COUNT_PRODUCTS, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, STAGED_UPLOAD
};
