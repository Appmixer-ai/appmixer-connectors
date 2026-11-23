'use strict';

// Abandoned checkouts, draft orders, inventory levels and returns on the
// GraphQL Admin API, read by the store-level triggers. Objects are returned as
// GraphQL returns them (camelCase fields, global ids, MoneyBag amounts); the
// only reshaping is that connections become plain arrays.

const client = require('./graphql-client');
const { mailingAddress } = require('./gql-orders');

const ADDRESS_FIELDS = `id firstName lastName company address1 address2 city province provinceCode
    country countryCodeV2 zip phone`;

const MONEY_BAG = 'shopMoney { amount currencyCode }';

const CUSTOMER_REF = `id legacyResourceId displayName
    defaultEmailAddress { emailAddress }
    defaultPhoneNumber { phoneNumber }`;

const CHECKOUT_FIELDS = `
    id name abandonedCheckoutUrl createdAt updatedAt completedAt note taxesIncluded discountCodes
    customAttributes { key value }
    subtotalPriceSet { ${MONEY_BAG} }
    totalDiscountSet { ${MONEY_BAG} }
    totalLineItemsPriceSet { ${MONEY_BAG} }
    totalTaxSet { ${MONEY_BAG} }
    totalPriceSet { ${MONEY_BAG} }
    customer { ${CUSTOMER_REF} }
    shippingAddress { ${ADDRESS_FIELDS} }
    billingAddress { ${ADDRESS_FIELDS} }
    lineItems(first: 50) {
        nodes {
            id title variantTitle sku quantity
            originalUnitPriceSet { ${MONEY_BAG} }
            originalTotalPriceSet { ${MONEY_BAG} }
            discountedTotalPriceSet { ${MONEY_BAG} }
            product { id title }
            variant { id title }
        }
    }`;

const DRAFT_ORDER_FIELDS = `
    id legacyResourceId name status email phone note2 tags poNumber taxExempt taxesIncluded
    currencyCode presentmentCurrencyCode invoiceUrl invoiceSentAt reserveInventoryUntil
    totalQuantityOfLineItems createdAt updatedAt completedAt
    order { id legacyResourceId name }
    customer { ${CUSTOMER_REF} }
    customAttributes { key value }
    appliedDiscount { title description value valueType amountSet { ${MONEY_BAG} } }
    shippingLine { title code custom originalPriceSet { ${MONEY_BAG} } }
    taxLines { title rate priceSet { ${MONEY_BAG} } }
    subtotalPriceSet { ${MONEY_BAG} }
    totalDiscountsSet { ${MONEY_BAG} }
    totalShippingPriceSet { ${MONEY_BAG} }
    totalTaxSet { ${MONEY_BAG} }
    totalPriceSet { ${MONEY_BAG} }
    shippingAddress { ${ADDRESS_FIELDS} }
    billingAddress { ${ADDRESS_FIELDS} }
    lineItems(first: 50) {
        nodes {
            id name title variantTitle sku vendor quantity custom requiresShipping taxable isGiftCard
            originalUnitPriceSet { ${MONEY_BAG} }
            originalTotalSet { ${MONEY_BAG} }
            discountedTotalSet { ${MONEY_BAG} }
            appliedDiscount { title description value valueType amountSet { ${MONEY_BAG} } }
            product { id title }
            variant { id title }
        }
    }`;

const INVENTORY_LEVEL_FIELDS = `
    id isActive createdAt updatedAt
    quantities(names: ["available", "on_hand", "committed", "incoming", "reserved"]) { name quantity }
    item {
        id legacyResourceId sku tracked
        variants(first: 1) { nodes { id legacyResourceId title displayName product { id title } } }
    }
    location { id legacyResourceId name }`;

const RETURN_FIELDS = `
    id name status totalQuantity createdAt requestApprovedAt closedAt
    order { id legacyResourceId name }
    decline { reason note }
    returnLineItems(first: 50) {
        nodes {
            id quantity customerNote returnReasonNote
            returnReasonDefinition { handle name }
            ... on ReturnLineItem { fulfillmentLineItem { id lineItem { id name } } }
        }
    }
    reverseFulfillmentOrders(first: 10) { nodes { id status } }`;

const GET_CHECKOUT = `query GetAbandonedCheckout($id: ID!) {
    node(id: $id) { ... on AbandonedCheckout { ${CHECKOUT_FIELDS} } }
}`;

// With 50 line items each, a page of 50 checkouts costs about 210 query points (max 1000).
const CHECKOUT_PAGE_SIZE = 50;

const LIST_CHECKOUTS = `query ListAbandonedCheckouts($first: Int!, $after: String) {
    abandonedCheckouts(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
        nodes { ${CHECKOUT_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const GET_DRAFT_ORDER = `query GetDraftOrder($id: ID!) {
    draftOrder(id: $id) { ${DRAFT_ORDER_FIELDS} }
}`;

const LATEST_DRAFT_ORDER = `query LatestDraftOrder($sortKey: DraftOrderSortKeys!) {
    draftOrders(first: 1, sortKey: $sortKey, reverse: true) { nodes { ${DRAFT_ORDER_FIELDS} } }
}`;

const GET_INVENTORY_LEVEL = `query GetInventoryLevel($id: ID!) {
    inventoryLevel(id: $id) { ${INVENTORY_LEVEL_FIELDS} }
}`;

const INVENTORY_LEVEL_BY_ITEM = `query InventoryLevelByItem($itemId: ID!, $locationId: ID!) {
    inventoryItem(id: $itemId) { inventoryLevel(locationId: $locationId) { ${INVENTORY_LEVEL_FIELDS} } }
}`;

// Inventory items have no updated-at sort; the newest item's first level is
// a recent, real level of the store.
const LATEST_INVENTORY_LEVEL = `query LatestInventoryLevel {
    inventoryItems(first: 1, reverse: true) {
        nodes { inventoryLevels(first: 1) { nodes { ${INVENTORY_LEVEL_FIELDS} } } }
    }
}`;

const CREATE_DRAFT_ORDER = `mutation CreateDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) { draftOrder { id } userErrors { field message } }
}`;

const UPDATE_DRAFT_ORDER = `mutation UpdateDraftOrder($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) { draftOrder { id } userErrors { field message } }
}`;

const DELETE_DRAFT_ORDER = `mutation DeleteDraftOrder($input: DraftOrderDeleteInput!) {
    draftOrderDelete(input: $input) { deletedId userErrors { field message } }
}`;

// The inventory item of a product variant.
const VARIANT_INVENTORY_ITEM = `query VariantInventoryItem($id: ID!) {
    productVariant(id: $id) { inventoryItem { id } }
}`;

const INVENTORY_ITEM_LOCATIONS = `query InventoryItemLocations($id: ID!) {
    inventoryItem(id: $id) { id tracked inventoryLevels(first: 50) { nodes { location { id } } } }
}`;

// Without an id, `location` is the shop's primary location.
const PRIMARY_LOCATION = 'query PrimaryLocation { location { id } }';

const TRACK_INVENTORY_ITEM = `mutation TrackInventoryItem($id: ID!) {
    inventoryItemUpdate(id: $id, input: { tracked: true }) { inventoryItem { id } userErrors { field message } }
}`;

const ACTIVATE_INVENTORY = `mutation ActivateInventory($inventoryItemId: ID!, $locationId: ID!) {
    inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId) {
        inventoryLevel { id } userErrors { field message }
    }
}`;

const SET_INVENTORY_QUANTITIES = `mutation SetInventoryQuantities($input: InventorySetQuantitiesInput!, $key: String!) {
    inventorySetQuantities(input: $input) @idempotent(key: $key) {
        inventoryAdjustmentGroup { id } userErrors { field message code }
    }
}`;

const GET_RETURN = `query GetReturn($id: ID!) {
    return(id: $id) { ${RETURN_FIELDS} }
}`;

// There is no top-level returns query: look at the recently updated orders
// that have a return and take their newest return.
const RECENT_RETURNS = `query RecentReturns {
    orders(first: 10, sortKey: UPDATED_AT, reverse: true, query: "-return_status:no_return") {
        nodes { returns(first: 1, reverse: true) { nodes { id createdAt } } }
    }
}`;

function present(value) {

    return value !== undefined && value !== null && String(value).trim() !== '';
}

function toBoolean(value) {

    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
}

// Expression input ({ ADD: [...] }) or a plain array → array of rows.
function rows(value) {

    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.ADD)) return value.ADD;
    return [];
}

function isCustom(item) {

    return item.itemType === 'custom' || (!item.itemType && !present(item.variantId));
}

/**
 * Whether the line items include a custom item, whose price needs a currency.
 * @param {object} inputs
 * @returns {boolean}
 */
function draftNeedsCurrency(inputs) {

    return rows(inputs.lineItems).some(isCustom);
}

/**
 * Line item rows → [DraftOrderLineItemInput].
 * @param {Array} items
 * @param {string} [currency] currency of custom item prices
 * @returns {Array}
 */
function lineItemsInput(items, currency) {

    return items.map((item, index) => {
        const position = `Line item ${index + 1}`;
        const quantity = parseInt(item.quantity, 10);
        const line = { quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1 };
        if (!isCustom(item)) {
            if (!present(item.variantId)) {
                throw new client.ShopifyError(`${position}: choose a product variant, or switch the item type to Custom.`, 422);
            }
            line.variantId = client.toGid('ProductVariant', String(item.variantId).trim());
            return line;
        }
        if (!present(item.title)) {
            throw new client.ShopifyError(`${position}: a custom item needs a title.`, 422);
        }
        const price = Number(item.price);
        if (!present(item.price) || !Number.isFinite(price)) {
            throw new client.ShopifyError(`${position} price must be a number, got "${item.price}".`, 422);
        }
        line.title = String(item.title).trim();
        line.originalUnitPriceWithCurrency = { amount: String(price), currencyCode: currency };
        if (present(item.sku)) line.sku = String(item.sku).trim();
        if (toBoolean(item.taxable) !== undefined) line.taxable = toBoolean(item.taxable);
        if (toBoolean(item.requiresShipping) !== undefined) line.requiresShipping = toBoolean(item.requiresShipping);
        return line;
    });
}

/**
 * Component inputs → DraftOrderInput. Empty fields are left out.
 * @param {object} inputs
 * @param {string} [currency] currency of custom item prices (the shop currency)
 * @returns {object}
 */
function toDraftOrderInput(inputs, currency) {

    const input = {};
    const items = rows(inputs.lineItems);
    if (items.length) input.lineItems = lineItemsInput(items, currency);
    for (const key of ['email', 'phone', 'note', 'poNumber']) {
        if (present(inputs[key])) input[key] = String(inputs[key]).trim();
    }
    if (present(inputs.tags)) input.tags = client.tagList(inputs.tags);
    if (present(inputs.customerId)) {
        input.purchasingEntity = { customerId: client.toGid('Customer', String(inputs.customerId).trim()) };
    }
    if (toBoolean(inputs.taxExempt) !== undefined) input.taxExempt = toBoolean(inputs.taxExempt);
    const shippingAddress = mailingAddress({
        firstName: inputs.shippingFirstName,
        lastName: inputs.shippingLastName,
        company: inputs.shippingCompany,
        address1: inputs.shippingAddress1,
        address2: inputs.shippingAddress2,
        city: inputs.shippingCity,
        provinceCode: inputs.shippingProvinceCode,
        countryCode: inputs.shippingCountryCode,
        zip: inputs.shippingZip,
        phone: inputs.shippingPhone
    }, 'Shipping');
    if (shippingAddress) input.shippingAddress = shippingAddress;
    return input;
}

function nodes(connection) {

    return connection && connection.nodes ? connection.nodes : [];
}

// connection { nodes } → array for the connection fields of each object.
function flattenCheckout(checkout) {

    if (!checkout) return null;
    return { ...checkout, lineItems: nodes(checkout.lineItems) };
}

function flattenDraftOrder(draftOrder) {

    if (!draftOrder) return null;
    return { ...draftOrder, lineItems: nodes(draftOrder.lineItems) };
}

function flattenInventoryLevel(level) {

    if (!level) return null;
    return { ...level, item: { ...level.item, variants: nodes(level.item && level.item.variants) } };
}

function flattenReturn(ret) {

    if (!ret) return null;
    return {
        ...ret,
        returnLineItems: nodes(ret.returnLineItems),
        reverseFulfillmentOrders: nodes(ret.reverseFulfillmentOrders)
    };
}

module.exports = (run) => ({

    /**
     * An abandoned checkout by id. The checkouts/* webhooks carry the same
     * numeric id. Null until Shopify lists the checkout as abandoned.
     * @param {string|number} id AbandonedCheckout gid or numeric id
     * @returns {Promise<object|null>}
     */
    async getCheckout(id) {

        const data = await run(GET_CHECKOUT, { id: client.toGid('AbandonedCheckout', id) });
        return data.node && data.node.id ? flattenCheckout(data.node) : null;
    },

    /**
     * Abandoned checkouts, newest first, up to `max`.
     * @param {object} [params]
     * @param {number} [params.max=250]
     * @returns {Promise<object[]>}
     */
    async listCheckouts({ max = 250 } = {}) {

        const checkouts = [];
        let after = null;
        do {
            const data = await run(LIST_CHECKOUTS, {
                first: Math.min(CHECKOUT_PAGE_SIZE, max - checkouts.length),
                after
            });
            checkouts.push(...data.abandonedCheckouts.nodes.map(flattenCheckout));
            const pageInfo = data.abandonedCheckouts.pageInfo;
            after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
        } while (after && checkouts.length < max);
        return checkouts;
    },

    /**
     * @param {string|number} id DraftOrder gid or numeric id
     * @returns {Promise<object|null>} null when the draft order does not exist (any more)
     */
    async getDraftOrder(id) {

        const data = await run(GET_DRAFT_ORDER, { id: client.toGid('DraftOrder', id) });
        return flattenDraftOrder(data.draftOrder);
    },

    /**
     * The newest draft order by creation (ID) or by last update (UPDATED_AT).
     * @param {'ID'|'UPDATED_AT'} sortKey
     * @returns {Promise<object|null>}
     */
    async latestDraftOrder(sortKey) {

        const data = await run(LATEST_DRAFT_ORDER, { sortKey });
        return flattenDraftOrder(data.draftOrders.nodes[0]);
    },

    /**
     * Create a draft order and return it.
     * @param {object} input DraftOrderInput
     * @returns {Promise<object>}
     */
    async createDraftOrder(input) {

        const data = await run(CREATE_DRAFT_ORDER, { input });
        const payload = client.checkUserErrors(data.draftOrderCreate, 'draftOrderCreate');
        return this.getDraftOrder(payload.draftOrder.id);
    },

    /**
     * @param {string|number} id DraftOrder gid or numeric id
     * @param {object} input DraftOrderInput with the fields to change
     */
    async updateDraftOrder(id, input) {

        const data = await run(UPDATE_DRAFT_ORDER, { id: client.toGid('DraftOrder', id), input });
        client.checkUserErrors(data.draftOrderUpdate, 'draftOrderUpdate');
    },

    async deleteDraftOrder(id) {

        const data = await run(DELETE_DRAFT_ORDER, { input: { id: client.toGid('DraftOrder', id) } });
        client.checkUserErrors(data.draftOrderDelete, 'draftOrderDelete');
    },

    /**
     * Set the available or on-hand quantity of an inventory item at a location
     * and return the inventory level. The item gets inventory tracking switched
     * on and is stocked at the location first when it is not yet.
     * @param {object} params
     * @param {string} params.item InventoryItem or ProductVariant gid, or a numeric inventory item id
     * @param {string} [params.locationId] none = the location the item is stocked at, else the primary location
     * @param {number} params.quantity
     * @param {string} [params.name='available'] 'available' | 'on_hand'
     * @param {string} [params.reason='correction']
     * @param {string} params.idempotencyKey
     * @returns {Promise<object>}
     */
    async setInventoryQuantity({ item, locationId, quantity, name = 'available', reason = 'correction', idempotencyKey }) {

        let inventoryItemId = String(item).trim();
        if (inventoryItemId.startsWith('gid://shopify/ProductVariant/')) {
            const data = await run(VARIANT_INVENTORY_ITEM, { id: inventoryItemId });
            if (!data.productVariant) {
                throw new client.ShopifyError(`Product variant ${inventoryItemId} not found.`, 404);
            }
            inventoryItemId = data.productVariant.inventoryItem.id;
        } else {
            inventoryItemId = client.toGid('InventoryItem', inventoryItemId);
        }

        const { inventoryItem } = await run(INVENTORY_ITEM_LOCATIONS, { id: inventoryItemId });
        if (!inventoryItem) {
            throw new client.ShopifyError(`Inventory item ${item} not found.`, 404);
        }
        const stockedAt = nodes(inventoryItem.inventoryLevels).map(level => level.location.id);
        let location = locationId ? client.toGid('Location', String(locationId).trim()) : stockedAt[0];
        if (!location) {
            location = (await run(PRIMARY_LOCATION)).location.id;
        }

        if (!inventoryItem.tracked) {
            const data = await run(TRACK_INVENTORY_ITEM, { id: inventoryItemId });
            client.checkUserErrors(data.inventoryItemUpdate, 'inventoryItemUpdate');
        }
        if (!stockedAt.includes(location)) {
            const data = await run(ACTIVATE_INVENTORY, { inventoryItemId, locationId: location });
            client.checkUserErrors(data.inventoryActivate, 'inventoryActivate');
        }

        const data = await run(SET_INVENTORY_QUANTITIES, {
            key: idempotencyKey,
            input: {
                name,
                reason,
                quantities: [{ inventoryItemId, locationId: location, quantity, changeFromQuantity: null }]
            }
        });
        client.checkUserErrors(data.inventorySetQuantities, 'inventorySetQuantities');
        return this.getInventoryLevel({ inventoryItemId, locationId: location });
    },

    /**
     * An inventory level by its gid (gid://shopify/InventoryLevel/1?inventory_item_id=2),
     * or by inventory item and location when no gid is at hand.
     * @param {object} params
     * @param {string} [params.id]
     * @param {string|number} [params.inventoryItemId]
     * @param {string|number} [params.locationId]
     * @returns {Promise<object|null>}
     */
    async getInventoryLevel({ id, inventoryItemId, locationId }) {

        if (id) {
            const data = await run(GET_INVENTORY_LEVEL, { id });
            return flattenInventoryLevel(data.inventoryLevel);
        }
        const data = await run(INVENTORY_LEVEL_BY_ITEM, {
            itemId: client.toGid('InventoryItem', inventoryItemId),
            locationId: client.toGid('Location', locationId)
        });
        return flattenInventoryLevel(data.inventoryItem && data.inventoryItem.inventoryLevel);
    },

    /**
     * A recent inventory level of the store.
     * @returns {Promise<object|null>}
     */
    async latestInventoryLevel() {

        const data = await run(LATEST_INVENTORY_LEVEL);
        const item = data.inventoryItems.nodes[0];
        return item ? flattenInventoryLevel(nodes(item.inventoryLevels)[0]) : null;
    },

    /**
     * @param {string|number} id Return gid or numeric id
     * @returns {Promise<object|null>}
     */
    async getReturn(id) {

        const data = await run(GET_RETURN, { id: client.toGid('Return', id) });
        return flattenReturn(data.return);
    },

    /**
     * The newest return of the recently updated orders.
     * @returns {Promise<object|null>}
     */
    async latestReturn() {

        const data = await run(RECENT_RETURNS);
        const latest = data.orders.nodes
            .map(order => nodes(order.returns)[0])
            .filter(Boolean)
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
        return latest ? this.getReturn(latest.id) : null;
    }
});

/**
 * The `fetch` of the checkouts/* webhook triggers. The payload carries the
 * numeric checkout id, which is the id of the AbandonedCheckout. GraphQL has
 * no other checkout object, and Shopify returns a checkout only once it holds
 * contact details and is left unpaid for a while — until then the trigger
 * emits the checkout id alone rather than nothing.
 * @param {object} api gql-store bound to a runner
 * @returns {function} (gid, payload) => Promise<object>
 */
module.exports.checkoutFetcher = api => async (gid, payload = {}) => {

    // A checkout gets its id only once Shopify lists it (after the buyer
    // entered contact details); until then the payload carries the token alone.
    const id = payload.id !== undefined && payload.id !== null ? payload.id : client.fromGid(gid);
    const checkout = id ? await api.getCheckout(id) : null;
    return checkout
        ? { ...checkout, token: payload.token || null }
        : { id: id ? client.toGid('AbandonedCheckout', id) : null, token: payload.token || null };
};

// Payload fields the checkout triggers need besides the ids.
module.exports.CHECKOUT_WEBHOOK_FIELDS = ['token'];

module.exports.CHECKOUT_FIELDS = CHECKOUT_FIELDS;
module.exports.DRAFT_ORDER_FIELDS = DRAFT_ORDER_FIELDS;
module.exports.INVENTORY_LEVEL_FIELDS = INVENTORY_LEVEL_FIELDS;
module.exports.RETURN_FIELDS = RETURN_FIELDS;
module.exports.toDraftOrderInput = toDraftOrderInput;
module.exports.draftNeedsCurrency = draftNeedsCurrency;
