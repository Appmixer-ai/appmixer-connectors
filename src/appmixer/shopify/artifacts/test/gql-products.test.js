const assert = require('assert');
const gqlProducts = require('../../gql-products');
const { toRestProduct, toSearchQuery, toSort, toProductInput, decodeAttachment } = gqlProducts;

// Product as returned live by the 2026-10 Admin API (QA store), trimmed.
function liveProduct() {

    return {
        id: 'gid://shopify/Product/16345061294161',
        title: 'gql-probe B',
        descriptionHtml: '<b>hi</b>',
        vendor: 'gql-probe',
        productType: 'Probe',
        handle: 'gql-probe-b',
        status: 'ACTIVE',
        tags: ['x', 'y z'],
        publishedAt: null,
        templateSuffix: null,
        createdAt: '2026-10-02T14:38:37Z',
        updatedAt: '2026-10-02T14:38:39Z',
        seo: { title: null, description: null },
        options: [{ id: 'gid://shopify/ProductOption/18957344014417', name: 'Title', position: 1, values: ['Default Title'] }],
        variants: {
            nodes: [{
                id: 'gid://shopify/ProductVariant/62790507298897',
                title: 'Default Title',
                price: '0.00',
                compareAtPrice: null,
                sku: null,
                position: 1,
                inventoryPolicy: 'DENY',
                inventoryQuantity: 0,
                taxable: true,
                createdAt: '2026-10-02T14:38:37Z',
                updatedAt: '2026-10-02T14:38:38Z',
                barcodes: { nodes: [] },
                selectedOptions: [{ name: 'Title', value: 'Default Title' }],
                inventoryItem: {
                    id: 'gid://shopify/InventoryItem/64808416903249',
                    tracked: false,
                    requiresShipping: true,
                    measurement: { weight: { unit: 'POUNDS', value: 0 } }
                },
                media: { nodes: [] }
            }]
        },
        media: {
            nodes: [{
                id: 'gid://shopify/MediaImage/73866459676753',
                alt: '',
                mediaContentType: 'IMAGE',
                status: 'READY',
                createdAt: '2026-10-02T14:38:37Z',
                updatedAt: '2026-10-02T14:38:39Z',
                image: { url: 'https://cdn.shopify.com/s/files/1/1079/6174/5489/files/placeholder.png?v=1790951919', width: 480, height: 480 }
            }]
        }
    };
}

// Two option, two variant product; the second variant shows the image.
function variantProduct() {

    const product = liveProduct();
    product.seo = { title: 'SEO title', description: 'SEO description' };
    product.publishedAt = '2026-10-02T12:14:53Z';
    product.options = [
        { id: 'gid://shopify/ProductOption/1', name: 'Size', position: 1, values: ['S', 'M'] },
        { id: 'gid://shopify/ProductOption/2', name: 'Color', position: 2, values: ['Red'] }
    ];
    const base = product.variants.nodes[0];
    product.variants.nodes = [
        {
            ...base, id: 'gid://shopify/ProductVariant/11', title: 'S / Red', price: '9.99', compareAtPrice: '12.50', sku: 'SKU-S',
            barcodes: { nodes: [{ value: '4006381333931' }] },
            selectedOptions: [{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'S' }],
            inventoryItem: { ...base.inventoryItem, tracked: true, measurement: { weight: { unit: 'KILOGRAMS', value: 1.5 } } }
        },
        {
            ...base, id: 'gid://shopify/ProductVariant/12', title: 'M / Red', position: 2, inventoryPolicy: 'CONTINUE',
            selectedOptions: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Red' }],
            media: { nodes: [{ id: 'gid://shopify/MediaImage/73866459676753' }] }
        }
    ];
    product.media.nodes.push({ id: 'gid://shopify/Video/5', alt: null, mediaContentType: 'VIDEO', status: 'READY' });
    return product;
}

// Mock `run`: records each call and answers from the handler.
function mockRun(handler) {

    const calls = [];
    const run = async (query, variables) => {
        calls.push({ query, variables });
        return handler(query, variables, calls.length - 1);
    };
    run.calls = calls;
    return run;
}

const noSleep = async () => {};

describe('Shopify GraphQL products', () => {

    describe('toRestProduct', () => {

        it('should map a live product to the REST shape', () => {

            const product = toRestProduct(liveProduct());

            assert.strictEqual(product.id, 16345061294161);
            assert.strictEqual(product.admin_graphql_api_id, 'gid://shopify/Product/16345061294161');
            assert.strictEqual(product.body_html, '<b>hi</b>');
            assert.strictEqual(product.product_type, 'Probe');
            assert.strictEqual(product.status, 'active');
            assert.strictEqual(product.tags, 'x, y z');
            assert.strictEqual(product.published_at, null);
            assert.strictEqual(product.metafields_global_title_tag, null);
            assert.deepStrictEqual(product.options, [
                { id: 18957344014417, product_id: 16345061294161, name: 'Title', position: 1, values: ['Default Title'] }
            ]);

            const [variant] = product.variants;
            assert.deepStrictEqual(variant, {
                id: 62790507298897,
                product_id: 16345061294161,
                title: 'Default Title',
                price: '0.00',
                compare_at_price: null,
                sku: null,
                position: 1,
                inventory_policy: 'deny',
                inventory_quantity: 0,
                inventory_item_id: 64808416903249,
                inventory_management: null,
                barcode: null,
                taxable: true,
                requires_shipping: true,
                grams: 0,
                weight: 0,
                weight_unit: 'lb',
                option1: 'Default Title',
                option2: null,
                option3: null,
                image_id: null,
                created_at: '2026-10-02T14:38:37Z',
                updated_at: '2026-10-02T14:38:38Z',
                admin_graphql_api_id: 'gid://shopify/ProductVariant/62790507298897'
            });

            assert.strictEqual(product.images.length, 1);
            assert.deepStrictEqual(product.images[0], {
                id: 73866459676753,
                product_id: 16345061294161,
                position: 1,
                alt: null,
                width: 480,
                height: 480,
                src: 'https://cdn.shopify.com/s/files/1/1079/6174/5489/files/placeholder.png?v=1790951919',
                variant_ids: [],
                created_at: '2026-10-02T14:38:37Z',
                updated_at: '2026-10-02T14:38:39Z',
                admin_graphql_api_id: 'gid://shopify/MediaImage/73866459676753'
            });
            assert.strictEqual(product.image, product.images[0]);
        });

        it('should map options by position, variant images, weights, SEO and skip non-image media', () => {

            const product = toRestProduct(variantProduct());

            assert.strictEqual(product.published_at, '2026-10-02T12:14:53Z');
            assert.strictEqual(product.metafields_global_title_tag, 'SEO title');
            assert.strictEqual(product.metafields_global_description_tag, 'SEO description');

            const [small, medium] = product.variants;
            assert.strictEqual(small.option1, 'S');
            assert.strictEqual(small.option2, 'Red');
            assert.strictEqual(small.option3, null);
            assert.strictEqual(small.price, '9.99');
            assert.strictEqual(small.compare_at_price, '12.50');
            assert.strictEqual(small.barcode, '4006381333931');
            assert.strictEqual(small.inventory_management, 'shopify');
            assert.strictEqual(small.grams, 1500);
            assert.strictEqual(small.weight_unit, 'kg');
            assert.strictEqual(medium.option1, 'M');
            assert.strictEqual(medium.inventory_policy, 'continue');
            assert.strictEqual(medium.image_id, 73866459676753);

            assert.strictEqual(product.images.length, 1);
            assert.deepStrictEqual(product.images[0].variant_ids, [12]);
        });

        it('should return null for a missing product and an empty image list without media', () => {

            assert.strictEqual(toRestProduct(null), null);
            const product = liveProduct();
            product.media = { nodes: [] };
            const rest = toRestProduct(product);
            assert.deepStrictEqual(rest.images, []);
            assert.strictEqual(rest.image, null);
        });
    });

    describe('filters', () => {

        it('should translate the CountProducts input to search syntax', () => {

            const query = toSearchQuery({
                vendor: 'Acme "Co"',
                product_type: 'Shoes',
                collection_id: '703179849809',
                created_at_min: '2026-01-01T00:00:00Z',
                created_at_max: '2026-02-01T00:00:00Z',
                updated_at_min: '',
                updated_at_max: null,
                published_at_min: '2026-01-05',
                published_status: 'published'
            });

            assert.strictEqual(query, 'vendor:"Acme \\"Co\\"" AND product_type:"Shoes" AND collection_id:"703179849809"'
                + ' AND created_at:>="2026-01-01T00:00:00Z" AND created_at:<="2026-02-01T00:00:00Z"'
                + ' AND published_at:>="2026-01-05" AND published_status:"published"');
        });

        it('should drop published_status any and empty filters', () => {

            assert.strictEqual(toSearchQuery({ published_status: 'any', vendor: '' }), undefined);
            assert.strictEqual(toSearchQuery({}), undefined);
        });

        it('should translate ids, since_id and status lists', () => {

            assert.strictEqual(
                toSearchQuery({ ids: '1, gid://shopify/Product/2', since_id: 5, status: 'active,DRAFT' }),
                '(id:"1" OR id:"2") AND id:>"5" AND (status:"active" OR status:"draft")'
            );
        });

        it('should translate REST order to sortKey and reverse', () => {

            assert.deepStrictEqual(toSort('created_at DESC'), { sortKey: 'CREATED_AT', reverse: true });
            assert.deepStrictEqual(toSort('updated_at desc'), { sortKey: 'UPDATED_AT', reverse: true });
            assert.deepStrictEqual(toSort('title'), { sortKey: 'TITLE', reverse: false });
            assert.deepStrictEqual(toSort('unknown DESC'), {});
            assert.deepStrictEqual(toSort(undefined), {});
        });
    });

    describe('toProductInput', () => {

        it('should map the CreateProduct payload and published to status', () => {

            assert.deepStrictEqual(toProductInput({
                title: 'Shoe', vendor: 'Acme', tags: 'a, b', published: true, body_html: '<p>x</p>', product_type: 'Shoes', images: []
            }), {
                title: 'Shoe', vendor: 'Acme', descriptionHtml: '<p>x</p>', productType: 'Shoes', tags: ['a', 'b'], status: 'ACTIVE'
            });
            assert.strictEqual(toProductInput({ published: false }).status, 'DRAFT');
            assert.strictEqual(toProductInput({ published: 'false' }).status, 'DRAFT');
            assert.strictEqual(toProductInput({ published: true, status: 'archived' }).status, 'ARCHIVED');
            assert.strictEqual(toProductInput({}).status, undefined);
            assert.deepStrictEqual(toProductInput({ metafields_global_title_tag: 'T' }).seo, { title: 'T' });
        });
    });

    describe('decodeAttachment', () => {

        it('should detect the image type from the data', () => {

            const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
            assert.strictEqual(decodeAttachment(png).mimeType, 'image/png');
            assert.strictEqual(decodeAttachment(`data:image/png;base64,${png}`).extension, 'png');
            assert.strictEqual(decodeAttachment(Buffer.from('GIF89a....').toString('base64')).mimeType, 'image/gif');
            assert.strictEqual(decodeAttachment(Buffer.from('ffd8ffe0', 'hex').toString('base64')).mimeType, 'image/jpeg');
        });
    });

    describe('methods', () => {

        it('get() should query by gid and throw 404 when the product does not exist', async () => {

            const run = mockRun((query, variables) => ({ product: variables.id.endsWith('/1') ? null : liveProduct() }));
            const api = gqlProducts(run);

            const product = await api.get(16345061294161, { fields: 'id,images' });
            assert.strictEqual(product.id, 16345061294161);
            assert.strictEqual(product.images.length, 1);
            assert.deepStrictEqual(run.calls[0].variables, { id: 'gid://shopify/Product/16345061294161' });

            await assert.rejects(api.get(1), error => error.statusCode === 404);
        });

        it('list() should translate limit/order, return variants for the picker and page by cursor', async () => {

            const run = mockRun(() => ({
                products: {
                    nodes: [variantProduct()],
                    pageInfo: { hasNextPage: true, endCursor: 'cursor-1' }
                }
            }));
            const api = gqlProducts(run);

            const page = await api.list({ limit: 1, order: 'created_at DESC' });
            assert.deepStrictEqual(run.calls[0].variables, { first: 1, sortKey: 'CREATED_AT', reverse: true });
            assert.strictEqual(page.length, 1);
            assert.strictEqual(page[0].title, 'gql-probe B');
            assert.deepStrictEqual(page[0].variants.map(v => [v.id, v.title]), [[11, 'S / Red'], [12, 'M / Red']]);
            assert.deepStrictEqual(page.nextPageParameters, { limit: 1, order: 'created_at DESC', after: 'cursor-1' });

            await api.list(page.nextPageParameters);
            assert.strictEqual(run.calls[1].variables.after, 'cursor-1');
        });

        it('list() should cap the page at 50 and pass the search query', async () => {

            const run = mockRun(() => ({ products: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } }));
            const page = await gqlProducts(run).list({ limit: 250, vendor: 'Acme' });

            assert.deepStrictEqual(run.calls[0].variables, { first: 50, query: 'vendor:"Acme"' });
            assert.deepStrictEqual(page, []);
            assert.strictEqual(page.nextPageParameters, undefined);
        });

        it('count() should pass the filter and return the number', async () => {

            const run = mockRun(() => ({ productsCount: { count: 8 } }));
            const api = gqlProducts(run);

            assert.strictEqual(await api.count({ collection_id: '703179849809', published_status: 'any' }), 8);
            assert.deepStrictEqual(run.calls[0].variables, { query: 'collection_id:"703179849809"' });
            assert.strictEqual(await api.count(), 8);
            assert.deepStrictEqual(run.calls[1].variables, {});
        });

        it('create() should stage base64 attachments, add src images and wait for media processing', async () => {

            const processing = liveProduct();
            processing.media.nodes[0] = { ...processing.media.nodes[0], status: 'PROCESSING', image: null };
            const uploads = [];

            const run = mockRun((query) => {
                if (query.includes('stagedUploadsCreate')) {
                    return {
                        stagedUploadsCreate: {
                            stagedTargets: [{
                                url: 'https://shopify-staged-uploads.storage.googleapis.com/tmp/1/image.png?X-Goog-Signature=x',
                                resourceUrl: 'https://shopify-staged-uploads.storage.googleapis.com/tmp/1/image.png',
                                parameters: [{ name: 'content_type', value: 'image/png' }, { name: 'acl', value: 'private' }]
                            }],
                            userErrors: []
                        }
                    };
                }
                if (query.includes('productCreate')) {
                    return { productCreate: { product: processing, userErrors: [] } };
                }
                return { product: liveProduct() };
            });
            const putFile = async (url, buffer, headers) => uploads.push({ url, buffer, headers });
            const api = gqlProducts(run, { putFile, sleep: noSleep });

            const png = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64');
            const product = await api.create({
                title: 'Shoe', vendor: 'Acme', tags: 'a', published: true, body_html: '<p>x</p>', product_type: 'Shoes',
                images: [{ attachment: png, position: 2 }, { src: 'https://example.com/a.png', position: 1 }]
            });

            assert.deepStrictEqual(run.calls[0].variables.input, [{
                resource: 'IMAGE', filename: 'image.png', mimeType: 'image/png', httpMethod: 'PUT', fileSize: '8'
            }]);
            assert.strictEqual(uploads.length, 1);
            assert.deepStrictEqual(uploads[0].headers, { 'Content-Type': 'image/png' });
            assert.strictEqual(uploads[0].buffer.toString('base64'), png);

            assert.deepStrictEqual(run.calls[1].variables, {
                product: { title: 'Shoe', vendor: 'Acme', descriptionHtml: '<p>x</p>', productType: 'Shoes', tags: ['a'], status: 'ACTIVE' },
                media: [
                    { originalSource: 'https://example.com/a.png', mediaContentType: 'IMAGE' },
                    { originalSource: 'https://shopify-staged-uploads.storage.googleapis.com/tmp/1/image.png', mediaContentType: 'IMAGE' }
                ]
            });
            // Media were still processing → product re-read once.
            assert.strictEqual(run.calls.length, 3);
            assert.ok(run.calls[2].query.includes('product(id: $id)'));
            assert.strictEqual(product.image.src, 'https://cdn.shopify.com/s/files/1/1079/6174/5489/files/placeholder.png?v=1790951919');
        });

        it('create() should reject attachments when no uploader is available', async () => {

            const run = mockRun(() => assert.fail('no GraphQL call expected'));
            await assert.rejects(
                gqlProducts(run).create({ title: 'x', images: [{ attachment: 'iVBORw0KGgo=' }] }),
                error => error.statusCode === 422 && /src/.test(error.message)
            );
        });

        it('create() should turn userErrors into a 422', async () => {

            const run = mockRun(() => ({
                productCreate: { product: null, userErrors: [{ field: ['title'], message: 'Title can\'t be blank' }] }
            }));
            await assert.rejects(
                gqlProducts(run).create({ title: '' }),
                error => error.statusCode === 422 && /title: Title can't be blank/.test(error.message)
            );
        });

        it('update() should add only new images and keep existing ones', async () => {

            const run = mockRun(() => ({ productUpdate: { product: liveProduct(), userErrors: [] } }));
            const api = gqlProducts(run, { sleep: noSleep });

            const existing = toRestProduct(liveProduct()).images;
            const product = await api.update('16345061294161', {
                id: '16345061294161', title: 'New', published: true,
                images: existing.concat([{ src: 'https://example.com/b.png' }])
            });

            assert.deepStrictEqual(run.calls[0].variables, {
                product: { title: 'New', status: 'ACTIVE', id: 'gid://shopify/Product/16345061294161' },
                media: [{ originalSource: 'https://example.com/b.png', mediaContentType: 'IMAGE' }]
            });
            assert.strictEqual(product.title, 'gql-probe B');
        });

        it('update() should not send media when there is nothing new', async () => {

            const run = mockRun(() => ({ productUpdate: { product: liveProduct(), userErrors: [] } }));
            await gqlProducts(run).update(1, { vendor: 'V' });
            assert.deepStrictEqual(run.calls[0].variables, { product: { vendor: 'V', id: 'gid://shopify/Product/1' } });
        });

        it('update() and delete() should map "Product does not exist" to 404', async () => {

            const notFound = { userErrors: [{ field: ['id'], message: 'Product does not exist' }] };
            const run = mockRun(query => (query.includes('productDelete')
                ? { productDelete: { deletedProductId: null, ...notFound } }
                : { productUpdate: { product: null, ...notFound } }));
            const api = gqlProducts(run);

            await assert.rejects(api.update(1, { title: 'x' }), error => error.statusCode === 404);
            await assert.rejects(api.delete(1), error => error.statusCode === 404);
            assert.deepStrictEqual(run.calls[1].variables, { input: { id: 'gid://shopify/Product/1' } });
        });

        it('delete() should return an empty object', async () => {

            const run = mockRun(() => ({ productDelete: { deletedProductId: 'gid://shopify/Product/1', userErrors: [] } }));
            assert.deepStrictEqual(await gqlProducts(run).delete('1'), {});
        });
    });
});
