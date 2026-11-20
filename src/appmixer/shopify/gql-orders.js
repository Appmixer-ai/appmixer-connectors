'use strict';

// Orders, their refunds and fulfillments on the GraphQL Admin API. Objects are
// returned as GraphQL returns them (camelCase fields, global ids, enums, money
// bags); the only reshaping is that connections become plain arrays
// (`lineItems: [...]` instead of `{ nodes: [...] }`).

const client = require('./graphql-client');

// Money is reported in the shop currency (MoneyBag.shopMoney).
const MONEY_BAG = 'shopMoney { amount currencyCode }';

const ADDRESS_FIELDS = `firstName lastName name company address1 address2 city province provinceCode
    country countryCodeV2 zip phone`;

const TAX_LINE_FIELDS = `title rate ratePercentage channelLiable priceSet { ${MONEY_BAG} }`;

const LINE_ITEM_FIELDS = `
    id name title variantTitle sku vendor quantity currentQuantity unfulfilledQuantity refundableQuantity
    taxable requiresShipping isGiftCard
    variant { id title } product { id title }
    originalUnitPriceSet { ${MONEY_BAG} } discountedUnitPriceSet { ${MONEY_BAG} }
    originalTotalSet { ${MONEY_BAG} } discountedTotalSet { ${MONEY_BAG} } totalDiscountSet { ${MONEY_BAG} }
    customAttributes { key value }
    taxLines { ${TAX_LINE_FIELDS} }`;

const TRANSACTION_FIELDS = `
    id kind status gateway test createdAt processedAt errorCode paymentId
    amountSet { ${MONEY_BAG} } parentTransaction { id }`;

// Fulfillment and refund line items point at the order's line item by id
// (with its name and SKU); the full line item is on the order.
const FULFILLMENT_FIELDS = `
    id legacyResourceId name status displayStatus totalQuantity requiresShipping
    createdAt updatedAt deliveredAt estimatedDeliveryAt inTransitAt
    location { id name } service { id handle serviceName }
    trackingInfo { company number url }
    lineItems: fulfillmentLineItems(first: 50) { nodes { id quantity lineItem { id name sku } } }`;

const REFUND_FIELDS = `
    id legacyResourceId note createdAt updatedAt processedAt
    totalRefundedSet { ${MONEY_BAG} }
    return { id name }
    refundLineItems(first: 50) { nodes {
        id quantity restockType restocked location { id name }
        priceSet { ${MONEY_BAG} } subtotalSet { ${MONEY_BAG} } totalTaxSet { ${MONEY_BAG} }
        lineItem { id name sku }
    } }
    transactions(first: 10) { nodes { ${TRANSACTION_FIELDS} } }
    orderAdjustments(first: 10) { nodes { id reason amountSet { ${MONEY_BAG} } taxAmountSet { ${MONEY_BAG} } } }`;

// An order carries a summary of its fulfillments and refunds; the full objects
// are what the fulfillment and refund triggers emit.
const ORDER_FULFILLMENT_FIELDS = `id legacyResourceId name status displayStatus createdAt updatedAt
    trackingInfo { company number url }`;

const ORDER_REFUND_FIELDS = `id legacyResourceId note createdAt processedAt totalRefundedSet { ${MONEY_BAG} }`;

// The order a fulfillment or refund belongs to, on the trigger outputs.
const PARENT_ORDER_FIELDS = 'order { id legacyResourceId name }';

const LINE_ITEMS_PAGE = 50;

const ORDER_FIELDS = `
    id legacyResourceId name number confirmationNumber poNumber email phone note tags
    createdAt updatedAt processedAt cancelledAt cancelReason closed closedAt confirmed test
    displayFinancialStatus displayFulfillmentStatus returnStatus fullyPaid unpaid
    currencyCode presentmentCurrencyCode taxesIncluded taxExempt customerAcceptsMarketing customerLocale
    sourceName sourceIdentifier statusPageUrl paymentGatewayNames discountCodes totalWeight subtotalLineItemsQuantity
    subtotalPriceSet { ${MONEY_BAG} }
    totalPriceSet { ${MONEY_BAG} }
    currentTotalPriceSet { ${MONEY_BAG} }
    totalTaxSet { ${MONEY_BAG} }
    totalDiscountsSet { ${MONEY_BAG} }
    totalShippingPriceSet { ${MONEY_BAG} }
    totalTipReceivedSet { ${MONEY_BAG} }
    totalReceivedSet { ${MONEY_BAG} }
    totalRefundedSet { ${MONEY_BAG} }
    totalOutstandingSet { ${MONEY_BAG} }
    customAttributes { key value }
    app { id name }
    customer {
        id legacyResourceId displayName firstName lastName
        defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber }
    }
    billingAddress { ${ADDRESS_FIELDS} }
    shippingAddress { ${ADDRESS_FIELDS} }
    taxLines { ${TAX_LINE_FIELDS} }
    shippingLines(first: 10) { nodes {
        id title code source carrierIdentifier
        originalPriceSet { ${MONEY_BAG} } discountedPriceSet { ${MONEY_BAG} } taxLines { ${TAX_LINE_FIELDS} }
    } }
    discountApplications(first: 10) { nodes {
        type: __typename allocationMethod targetSelection targetType
        value { type: __typename ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
        ... on DiscountCodeApplication { code }
        ... on ManualDiscountApplication { title description }
        ... on ScriptDiscountApplication { title }
        ... on AutomaticDiscountApplication { title }
    } }
    lineItems(first: ${LINE_ITEMS_PAGE}) { nodes { ${LINE_ITEM_FIELDS} } pageInfo { hasNextPage endCursor } }
    fulfillments(first: 10) { ${ORDER_FULFILLMENT_FIELDS} }
    refunds(first: 10) { ${ORDER_REFUND_FIELDS} }
    transactions(first: 10) { ${TRANSACTION_FIELDS} }`;

// Full orders are expensive: a page of 100 is requested at ~600 points, safely
// under Shopify's 1000-point single query limit (250 would be ~740).
const ORDERS_PAGE = 100;

const GET_ORDER = `query GetOrder($id: ID!) {
    order(id: $id) { ${ORDER_FIELDS} }
}`;

const FIND_ORDERS = `query FindOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
    orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${ORDER_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

// Light listing for the order picker of the inspector.
const PICK_ORDERS = `query PickOrders($first: Int!, $query: String) {
    orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
        nodes { id name email createdAt totalPriceSet { shopMoney { amount currencyCode } } }
    }
}`;

const MORE_LINE_ITEMS = `query OrderLineItems($id: ID!, $after: String) {
    order(id: $id) {
        lineItems(first: 250, after: $after) { nodes { ${LINE_ITEM_FIELDS} } pageInfo { hasNextPage endCursor } }
    }
}`;

const COUNT_ORDERS = `query CountOrders($query: String) {
    ordersCount(query: $query, limit: null) { count }
}`;

const GET_REFUND = `query GetRefund($id: ID!) {
    refund(id: $id) { ${REFUND_FIELDS} ${PARENT_ORDER_FIELDS} }
}`;

const GET_FULFILLMENT = `query GetFulfillment($id: ID!) {
    fulfillment(id: $id) { ${FULFILLMENT_FIELDS} ${PARENT_ORDER_FIELDS} }
}`;

// Recently changed orders with the ids and dates of their refunds and
// fulfillments, to find the newest one for a trigger's test().
const RECENT_CHILDREN = `query RecentOrderChildren($first: Int!) {
    orders(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
            refunds(first: 10) { id createdAt updatedAt }
            fulfillments(first: 10) { id createdAt updatedAt }
        }
    }
}`;

const SHOP_CURRENCY = 'query ShopCurrency { shop { currencyCode } }';

const CREATE_ORDER = `mutation CreateOrder($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
    orderCreate(order: $order, options: $options) { order { id } userErrors { field message } }
}`;

const UPDATE_ORDER = `mutation UpdateOrder($input: OrderInput!) {
    orderUpdate(input: $input) { order { id } userErrors { field message } }
}`;

const DELETE_ORDER = `mutation DeleteOrder($orderId: ID!) {
    orderDelete(orderId: $orderId) { deletedId userErrors { field message code } }
}`;

// Cancelling runs as a background job: the order shows cancelledAt once the job is done.
const CANCEL_ORDER = `mutation CancelOrder($orderId: ID!, $reason: OrderCancelReason!, $restock: Boolean!,
    $notifyCustomer: Boolean, $staffNote: String, $refundMethod: OrderCancelRefundMethodInput) {
    orderCancel(orderId: $orderId, reason: $reason, restock: $restock, notifyCustomer: $notifyCustomer,
        staffNote: $staffNote, refundMethod: $refundMethod) {
        job { id done }
        orderCancelUserErrors { field message code }
    }
}`;

const MARK_ORDER_AS_PAID = `mutation MarkOrderAsPaid($input: OrderMarkAsPaidInput!) {
    orderMarkAsPaid(input: $input) { order { id } userErrors { field message } }
}`;

const REFUNDABLE_LINE_ITEMS = `query RefundableLineItems($id: ID!) {
    order(id: $id) { id lineItems(first: 250) { nodes { id refundableQuantity } } }
}`;

// The payments a refund of these line items (and shipping) returns money to.
const SUGGESTED_REFUND = `query SuggestedRefund($id: ID!, $refundLineItems: [RefundLineItemInput!], $refundShipping: Boolean) {
    order(id: $id) {
        suggestedRefund(refundLineItems: $refundLineItems, refundShipping: $refundShipping) {
            suggestedTransactions { gateway amountSet { shopMoney { amount } } parentTransaction { id } }
        }
    }
}`;

const CREATE_REFUND = `mutation CreateRefund($input: RefundInput!, $key: String!) {
    refundCreate(input: $input) @idempotent(key: $key) { refund { id } userErrors { field message } }
}`;

// Fulfillment orders that can still be fulfilled, with what remains of each line item.
const OPEN_FULFILLMENT_ORDERS = `query OpenFulfillmentOrders($id: ID!) {
    order(id: $id) {
        id
        fulfillmentOrders(first: 50) { nodes {
            id status
            lineItems(first: 250) { nodes { id remainingQuantity lineItem { id } } }
        } }
    }
}`;

const CREATE_FULFILLMENT = `mutation CreateFulfillment($fulfillment: FulfillmentInput!) {
    fulfillmentCreate(fulfillment: $fulfillment) { fulfillment { id } userErrors { field message } }
}`;

const UPDATE_FULFILLMENT_TRACKING = `mutation UpdateFulfillmentTracking($fulfillmentId: ID!,
    $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) {
    fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput,
        notifyCustomer: $notifyCustomer) {
        fulfillment { id } userErrors { field message }
    }
}`;

const FULFILLABLE_STATUSES = ['OPEN', 'IN_PROGRESS'];

// Values of the typed filters → order search syntax. 'any' (or empty) = no filter.
const STATUS_FILTERS = ['open', 'closed', 'cancelled'];
const FINANCIAL_FILTERS = ['authorized', 'pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded', 'voided', 'expired'];
const FULFILLMENT_FILTERS = ['shipped', 'partial', 'unshipped', 'unfulfilled', 'fulfilled', 'scheduled', 'on_hold', 'request_declined'];
// Everything that is not paid yet.
const UNPAID = '(financial_status:authorized OR financial_status:pending OR financial_status:partially_paid)';

const SORT_KEYS = ['CREATED_AT', 'UPDATED_AT', 'PROCESSED_AT', 'ORDER_NUMBER', 'TOTAL_PRICE', 'CUSTOMER_NAME',
    'FINANCIAL_STATUS', 'FULFILLMENT_STATUS', 'ID'];

function nodes(connection) {

    return (connection && connection.nodes) || [];
}

function flattenFulfillment(fulfillment) {

    if (!fulfillment) return fulfillment;
    return { ...fulfillment, lineItems: nodes(fulfillment.lineItems) };
}

function flattenRefund(refund) {

    if (!refund) return refund;
    return {
        ...refund,
        refundLineItems: nodes(refund.refundLineItems),
        transactions: nodes(refund.transactions),
        orderAdjustments: nodes(refund.orderAdjustments)
    };
}

/**
 * connection { nodes } → array for every connection of the order, recursively.
 * @param {object} order GraphQL Order
 * @param {Array} [allLineItems] all line items when the order had more than one page of them
 * @returns {object}
 */
function flattenOrder(order, allLineItems) {

    if (!order) return order;
    return {
        ...order,
        shippingLines: nodes(order.shippingLines),
        discountApplications: nodes(order.discountApplications),
        lineItems: allLineItems || nodes(order.lineItems)
    };
}

function present(value) {

    return value !== undefined && value !== null && String(value).trim() !== '';
}

// A date input → ISO timestamp for the search query (also keeps arbitrary text
// out of the query string).
function isoDate(value, name) {

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new client.ShopifyError(`${name} must be a date, got "${value}".`, 422);
    }
    return date.toISOString();
}

function numericId(value, name) {

    const id = client.fromGid(String(value).trim());
    if (!/^\d+$/.test(String(id))) {
        throw new client.ShopifyError(`${name} must be a numeric id or a global id, got "${value}".`, 422);
    }
    return id;
}

function enumFilter(value, allowed, field, name) {

    const normalized = present(value) ? String(value).trim().toLowerCase() : 'any';
    if (normalized === 'any') return null;
    if (!allowed.includes(normalized)) {
        throw new client.ShopifyError(`Unsupported ${name} "${value}".`, 422);
    }
    return `${field}:${normalized}`;
}

/**
 * Typed filters and a free Shopify search query → one order search query.
 * @param {object} filters
 * @param {string} [filters.query] Shopify order search syntax
 * @param {string} [filters.status] open | closed | cancelled | any
 * @param {string} [filters.financialStatus] financial status, 'unpaid' or 'any'
 * @param {string} [filters.fulfillmentStatus] fulfillment status or 'any'
 * @param {string} [filters.customerId] numeric or global id
 * @param {string} [filters.createdAtMin]
 * @param {string} [filters.createdAtMax]
 * @param {string} [filters.updatedAtMin]
 * @param {string} [filters.updatedAtMax]
 * @returns {string|null}
 */
function searchQuery(filters = {}) {

    const terms = [];
    if (present(filters.query)) terms.push(`(${String(filters.query).trim()})`);

    const status = enumFilter(filters.status, STATUS_FILTERS, 'status', 'order status');
    if (status) terms.push(status);

    if (present(filters.financialStatus) && String(filters.financialStatus).trim().toLowerCase() === 'unpaid') {
        terms.push(UNPAID);
    } else {
        const financial = enumFilter(filters.financialStatus, FINANCIAL_FILTERS, 'financial_status', 'financial status');
        if (financial) terms.push(financial);
    }

    const fulfillment = enumFilter(filters.fulfillmentStatus, FULFILLMENT_FILTERS, 'fulfillment_status', 'fulfillment status');
    if (fulfillment) terms.push(fulfillment);

    if (present(filters.customerId)) terms.push(`customer_id:${numericId(filters.customerId, 'Customer ID')}`);
    if (present(filters.createdAtMin)) terms.push(`created_at:>='${isoDate(filters.createdAtMin, 'Created After')}'`);
    if (present(filters.createdAtMax)) terms.push(`created_at:<='${isoDate(filters.createdAtMax, 'Created Before')}'`);
    if (present(filters.updatedAtMin)) terms.push(`updated_at:>='${isoDate(filters.updatedAtMin, 'Updated After')}'`);
    if (present(filters.updatedAtMax)) terms.push(`updated_at:<='${isoDate(filters.updatedAtMax, 'Updated Before')}'`);

    return terms.length ? terms.join(' AND ') : null;
}

/**
 * Address inputs of a component → MailingAddressInput. Fields left empty stay
 * out. The country and province are taken as codes only (CZ, ON).
 * @param {object} fields { firstName, lastName, company, address1, address2, city, provinceCode, countryCode, zip, phone }
 * @param {string} label for error messages, e.g. 'Billing'
 * @returns {object|undefined}
 */
function mailingAddress(fields = {}, label = 'Address') {

    const input = {};
    for (const key of ['firstName', 'lastName', 'company', 'address1', 'address2', 'city', 'provinceCode', 'countryCode', 'zip', 'phone']) {
        if (present(fields[key])) input[key] = String(fields[key]).trim();
    }
    if (input.countryCode !== undefined) {
        if (!/^[A-Za-z]{2}$/.test(input.countryCode)) {
            throw new client.ShopifyError(`${label} Country Code must be a two-letter ISO code (for example CZ or US), got "${input.countryCode}".`, 422);
        }
        input.countryCode = input.countryCode.toUpperCase();
    }
    if (input.provinceCode !== undefined) {
        if (!/^[A-Za-z0-9]{1,3}$/.test(input.provinceCode)) {
            throw new client.ShopifyError(`${label} Province Code must be a province or state code (for example ON or CA), got "${input.provinceCode}".`, 422);
        }
        input.provinceCode = input.provinceCode.toUpperCase();
    }
    return Object.keys(input).length ? input : undefined;
}

const RESTOCK_TYPES = ['NO_RESTOCK', 'CANCEL', 'RETURN'];

/**
 * Line items to refund → [RefundLineItemInput]. No rows refund every line item
 * that can still be refunded, in full.
 * @param {Array} rows [{ lineItemId, quantity, restockType }]
 * @param {Array} refundable the order's line items [{ id, refundableQuantity }]
 * @param {string} [defaultRestock='NO_RESTOCK']
 * @returns {Array}
 */
function refundLineItems(rows, refundable, defaultRestock = 'NO_RESTOCK') {

    const restock = value => {
        const type = present(value) ? String(value).trim().toUpperCase() : defaultRestock;
        if (!RESTOCK_TYPES.includes(type)) {
            throw new client.ShopifyError(`Unsupported restock type "${value}".`, 422);
        }
        return type;
    };
    if (!rows.length) {
        return refundable
            .filter(item => item.refundableQuantity > 0)
            .map(item => ({ lineItemId: item.id, quantity: item.refundableQuantity, restockType: restock() }));
    }
    return rows.map((row, index) => {
        if (!present(row.lineItemId)) {
            throw new client.ShopifyError(`Line item ${index + 1}: the line item ID is required.`, 422);
        }
        const lineItemId = client.toGid('LineItem', String(row.lineItemId).trim());
        const line = refundable.find(item => item.id === lineItemId);
        if (!line) {
            throw new client.ShopifyError(`Line item ${index + 1}: ${lineItemId} is not a line item of the order.`, 422);
        }
        const quantity = present(row.quantity) ? parseInt(row.quantity, 10) : line.refundableQuantity;
        if (!Number.isFinite(quantity) || quantity < 1) {
            throw new client.ShopifyError(`Line item ${index + 1}: the quantity must be a positive whole number.`, 422);
        }
        return { lineItemId, quantity, restockType: restock(row.restockType) };
    });
}

/**
 * Open fulfillment orders of an order → FulfillmentInput.lineItemsByFulfillmentOrder.
 * No rows fulfill everything that remains; rows (order line item + quantity)
 * fulfill just those units.
 * @param {Array} fulfillmentOrders [{ id, status, lineItems: { nodes: [{ id, remainingQuantity, lineItem: { id } }] } }]
 * @param {Array} rows [{ lineItemId, quantity }]
 * @returns {Array}
 */
function fulfillmentLineItems(fulfillmentOrders, rows) {

    const open = fulfillmentOrders.filter(order => FULFILLABLE_STATUSES.includes(order.status));
    if (!open.length) {
        throw new client.ShopifyError('The order has nothing left to fulfill: it has no open fulfillment orders.', 422);
    }
    if (!rows.length) {
        return open.map(order => ({ fulfillmentOrderId: order.id }));
    }

    const byOrder = new Map();
    rows.forEach((row, index) => {
        if (!present(row.lineItemId)) {
            throw new client.ShopifyError(`Line item ${index + 1}: the line item ID is required.`, 422);
        }
        const lineItemId = client.toGid('LineItem', String(row.lineItemId).trim());
        let wanted = present(row.quantity) ? parseInt(row.quantity, 10) : Infinity;
        if (!(wanted > 0)) {
            throw new client.ShopifyError(`Line item ${index + 1}: the quantity must be a positive whole number.`, 422);
        }
        let matched = 0;
        for (const order of open) {
            for (const item of nodes(order.lineItems)) {
                const sameItem = item.lineItem && item.lineItem.id === lineItemId;
                if (wanted <= 0 || !sameItem || item.remainingQuantity < 1) continue;
                const quantity = Math.min(wanted, item.remainingQuantity);
                wanted -= quantity;
                matched += quantity;
                if (!byOrder.has(order.id)) byOrder.set(order.id, []);
                byOrder.get(order.id).push({ id: item.id, quantity });
            }
        }
        if (!matched) {
            throw new client.ShopifyError(`Line item ${index + 1}: ${lineItemId} has nothing left to fulfill.`, 422);
        }
    });
    return [...byOrder.entries()].map(([fulfillmentOrderId, fulfillmentOrderLineItems]) => ({
        fulfillmentOrderId,
        fulfillmentOrderLineItems
    }));
}

/**
 * Tracking inputs → FulfillmentTrackingInput; undefined when all are empty.
 * @param {object} inputs { trackingCompany, trackingNumber, trackingUrl }
 * @returns {object|undefined}
 */
function trackingInfo(inputs) {

    const info = {};
    if (present(inputs.trackingCompany)) info.company = String(inputs.trackingCompany).trim();
    if (present(inputs.trackingNumber)) info.number = String(inputs.trackingNumber).trim();
    if (present(inputs.trackingUrl)) info.url = String(inputs.trackingUrl).trim();
    return Object.keys(info).length ? info : undefined;
}

function sortKey(value) {

    if (!present(value)) return 'CREATED_AT';
    const key = String(value).trim().toUpperCase();
    if (!SORT_KEYS.includes(key)) {
        throw new client.ShopifyError(`Unsupported sort "${value}".`, 422);
    }
    return key;
}

module.exports = (run) => {

    // Orders with more line items than one page holds get the rest fetched here.
    async function remainingLineItems(order) {

        const page = order.lineItems;
        if (!page || !page.pageInfo || !page.pageInfo.hasNextPage) return undefined;
        const items = page.nodes.slice();
        let after = page.pageInfo.endCursor;
        while (after) {
            const data = await run(MORE_LINE_ITEMS, { id: order.id, after });
            const next = data.order.lineItems;
            items.push(...next.nodes);
            after = next.pageInfo.hasNextPage ? next.pageInfo.endCursor : null;
        }
        return items;
    }

    async function toOrder(order) {

        return flattenOrder(order, await remainingLineItems(order));
    }

    // The order, or null when there is none with that id.
    async function fetch(id) {

        const data = await run(GET_ORDER, { id: client.toGid('Order', id) });
        return data.order ? toOrder(data.order) : null;
    }

    async function get(id) {

        const order = await fetch(id);
        if (!order) {
            throw new client.ShopifyError(`Order ${id} not found.`, 404);
        }
        return order;
    }

    // A refund or fulfillment changes its order's updatedAt, so the newest
    // one is on one of the most recently updated orders.
    async function newestChild(key, by) {

        const data = await run(RECENT_CHILDREN, { first: 50 });
        let newest = null;
        for (const order of data.orders.nodes) {
            for (const child of order[key] || []) {
                if (!newest || child[by] > newest[by]) newest = child;
            }
        }
        return newest;
    }

    return {

        get,
        fetch,

        /**
         * Orders matching a search query, up to `max` of them.
         * @param {object} params
         * @param {string} [params.query] order search query (see searchQuery)
         * @param {string} [params.sortKey] OrderSortKeys value
         * @param {boolean} [params.reverse]
         * @param {number} [params.max=250]
         * @returns {Promise<Array>}
         */
        async find({ query, sortKey: sort, reverse, max = 250 } = {}) {

            const orders = [];
            let after = null;
            do {
                const data = await run(FIND_ORDERS, {
                    first: Math.min(ORDERS_PAGE, max - orders.length),
                    after,
                    query: query || null,
                    sortKey: sortKey(sort),
                    reverse: !!reverse
                });
                for (const node of data.orders.nodes) {
                    orders.push(await toOrder(node));
                }
                after = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null;
            } while (after && orders.length < max);
            return orders;
        },

        // Newest orders, light: { id, name, email, createdAt, totalPriceSet }.
        async pick({ query, max = 100 } = {}) {

            const data = await run(PICK_ORDERS, { first: Math.min(max, 250), query: query || null });
            return data.orders.nodes;
        },

        async count(query) {

            const data = await run(COUNT_ORDERS, { query: query || null });
            return data.ordersCount.count;
        },

        /**
         * Create an order and return it.
         * @param {object} order OrderCreateOrderInput; money amounts without a
         *   currency get the shop currency (or `order.currency`)
         * @param {object} [options] OrderCreateOptionsInput
         * @returns {Promise<object>}
         */
        async create(order, options = {}) {

            const data = await run(CREATE_ORDER, { order, options });
            const payload = client.checkUserErrors(data.orderCreate, 'orderCreate');
            return get(payload.order.id);
        },

        async shopCurrency() {

            const data = await run(SHOP_CURRENCY);
            return data.shop.currencyCode;
        },

        // input: OrderInput (with the order id).
        async update(input) {

            const data = await run(UPDATE_ORDER, { input: { ...input, id: client.toGid('Order', input.id) } });
            client.checkUserErrors(data.orderUpdate, 'orderUpdate');
        },

        async delete(id) {

            const data = await run(DELETE_ORDER, { orderId: client.toGid('Order', id) });
            const errors = (data.orderDelete && data.orderDelete.userErrors) || [];
            if (errors.some(error => error.code === 'NOT_FOUND')) {
                throw new client.ShopifyError(`Order ${id} not found.`, 404, errors);
            }
            client.checkUserErrors(data.orderDelete, 'orderDelete');
        },

        /**
         * Cancel an order. Shopify cancels in a background job.
         * @param {object} params
         * @param {string} params.id order gid or numeric id
         * @param {string} params.reason OrderCancelReason
         * @param {boolean} params.restock
         * @param {boolean} params.refund refund the payments to the original payment methods
         * @param {boolean} [params.notifyCustomer]
         * @param {string} [params.staffNote]
         * @returns {Promise<object>} the job { id, done }
         */
        async cancel({ id, reason, restock, refund, notifyCustomer, staffNote }) {

            const data = await run(CANCEL_ORDER, {
                orderId: client.toGid('Order', id),
                reason,
                restock: !!restock,
                notifyCustomer: !!notifyCustomer,
                staffNote: staffNote || null,
                refundMethod: refund ? { originalPaymentMethodsRefund: true } : null
            });
            const payload = data.orderCancel || {};
            client.checkUserErrors({ userErrors: payload.orderCancelUserErrors }, 'orderCancel');
            return payload.job || null;
        },

        // Mark an order as paid (records a manual payment of the outstanding amount) and return it.
        async markAsPaid(id) {

            const data = await run(MARK_ORDER_AS_PAID, { input: { id: client.toGid('Order', id) } });
            const payload = client.checkUserErrors(data.orderMarkAsPaid, 'orderMarkAsPaid');
            return get(payload.order.id);
        },

        /**
         * Create a refund and return it (with its order).
         * @param {object} params
         * @param {string} params.orderId
         * @param {Array} [params.lineItems] [{ lineItemId, quantity, restockType }]; none = everything refundable
         * @param {boolean} [params.refundShipping]
         * @param {boolean} [params.refundPayment] return the money to the payments Shopify suggests
         * @param {string} [params.note]
         * @param {boolean} [params.notify]
         * @param {string} params.idempotencyKey
         * @returns {Promise<object>}
         */
        async createRefund({ orderId, lineItems = [], refundShipping, refundPayment, note, notify, idempotencyKey }) {

            const id = client.toGid('Order', orderId);
            const context = await run(REFUNDABLE_LINE_ITEMS, { id });
            if (!context.order) {
                throw new client.ShopifyError(`Order ${orderId} not found.`, 404);
            }
            const input = { orderId: id, notify: !!notify };
            input.refundLineItems = refundLineItems(lineItems, nodes(context.order.lineItems));
            if (refundShipping) input.shipping = { fullRefund: true };
            if (present(note)) input.note = String(note);
            if (!input.refundLineItems.length && !refundShipping) {
                throw new client.ShopifyError('The order has nothing left to refund.', 422);
            }

            if (refundPayment) {
                const suggested = await run(SUGGESTED_REFUND, {
                    id,
                    refundLineItems: input.refundLineItems,
                    refundShipping: !!refundShipping
                });
                const transactions = (suggested.order.suggestedRefund.suggestedTransactions || [])
                    .filter(transaction => transaction.parentTransaction
                        && Number(transaction.amountSet.shopMoney.amount) > 0)
                    .map(transaction => ({
                        orderId: id,
                        gateway: transaction.gateway,
                        kind: 'REFUND',
                        amount: transaction.amountSet.shopMoney.amount,
                        parentId: transaction.parentTransaction.id
                    }));
                if (transactions.length) input.transactions = transactions;
            }

            const data = await run(CREATE_REFUND, { input, key: idempotencyKey });
            const payload = client.checkUserErrors(data.refundCreate, 'refundCreate');
            return this.fetchRefund(payload.refund.id);
        },

        /**
         * Fulfill an order's open fulfillment orders (or some of their line items)
         * and return the fulfillment (with its order).
         * @param {object} params
         * @param {string} params.orderId
         * @param {Array} [params.lineItems] [{ lineItemId, quantity }]; none = everything that remains
         * @param {object} [params.trackingInfo] { company, number, url }
         * @param {boolean} [params.notifyCustomer]
         * @returns {Promise<object>}
         */
        async createFulfillment({ orderId, lineItems = [], trackingInfo, notifyCustomer }) {

            const data = await run(OPEN_FULFILLMENT_ORDERS, { id: client.toGid('Order', orderId) });
            if (!data.order) {
                throw new client.ShopifyError(`Order ${orderId} not found.`, 404);
            }
            const fulfillment = {
                lineItemsByFulfillmentOrder: fulfillmentLineItems(nodes(data.order.fulfillmentOrders), lineItems),
                notifyCustomer: !!notifyCustomer
            };
            if (trackingInfo && Object.keys(trackingInfo).length) fulfillment.trackingInfo = trackingInfo;

            const created = await run(CREATE_FULFILLMENT, { fulfillment });
            const payload = client.checkUserErrors(created.fulfillmentCreate, 'fulfillmentCreate');
            return this.fetchFulfillment(payload.fulfillment.id);
        },

        /**
         * Replace the tracking information of a fulfillment.
         * @param {object} params
         * @param {string} params.fulfillmentId
         * @param {object} params.trackingInfo { company, number, url }
         * @param {boolean} [params.notifyCustomer]
         */
        async updateFulfillmentTracking({ fulfillmentId, trackingInfo, notifyCustomer }) {

            const data = await run(UPDATE_FULFILLMENT_TRACKING, {
                fulfillmentId: client.toGid('Fulfillment', fulfillmentId),
                trackingInfoInput: trackingInfo,
                notifyCustomer: !!notifyCustomer
            });
            client.checkUserErrors(data.fulfillmentTrackingInfoUpdate, 'fulfillmentTrackingInfoUpdate');
        },

        // The refund (with its order), or null when there is none with that id.
        async fetchRefund(id) {

            const data = await run(GET_REFUND, { id: client.toGid('Refund', id) });
            return flattenRefund(data.refund) || null;
        },

        // The fulfillment (with its order), or null when there is none with that id.
        async fetchFulfillment(id) {

            const data = await run(GET_FULFILLMENT, { id: client.toGid('Fulfillment', id) });
            return flattenFulfillment(data.fulfillment) || null;
        },

        // The most recently created refund among recently changed orders.
        async latestRefund() {

            const refund = await newestChild('refunds', 'createdAt');
            return refund ? this.fetchRefund(refund.id) : null;
        },

        /**
         * The most recently created or updated fulfillment among recently
         * changed orders.
         * @param {string} by 'createdAt' | 'updatedAt'
         */
        async latestFulfillment(by = 'createdAt') {

            const fulfillment = await newestChild('fulfillments', by);
            return fulfillment ? this.fetchFulfillment(fulfillment.id) : null;
        }
    };
};

module.exports.searchQuery = searchQuery;
module.exports.mailingAddress = mailingAddress;
module.exports.refundLineItems = refundLineItems;
module.exports.fulfillmentLineItems = fulfillmentLineItems;
module.exports.trackingInfo = trackingInfo;
module.exports.flattenOrder = flattenOrder;
module.exports.flattenRefund = flattenRefund;
module.exports.flattenFulfillment = flattenFulfillment;
module.exports.ORDER_FIELDS = ORDER_FIELDS;
module.exports.REFUND_FIELDS = REFUND_FIELDS;
module.exports.FULFILLMENT_FIELDS = FULFILLMENT_FIELDS;
