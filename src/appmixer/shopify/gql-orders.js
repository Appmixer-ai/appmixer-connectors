'use strict';

// Orders, their refunds and fulfillments on the GraphQL Admin API, returned in
// the REST shapes the order components and their users' flows were built on.

const client = require('./graphql-client');

const MONEY = 'shopMoney { amount currencyCode } presentmentMoney { amount currencyCode }';

const TAX_LINE_FIELDS = `title rate channelLiable priceSet { ${MONEY} }`;

const LINE_ITEM_FIELDS = `
    id name title variantTitle quantity currentQuantity unfulfilledQuantity sku vendor taxable requiresShipping isGiftCard
    variant { id } product { id } weight { unit value }
    originalUnitPriceSet { ${MONEY} } totalDiscountSet { ${MONEY} }
    customAttributes { key value }
    taxLines { ${TAX_LINE_FIELDS} }`;

// Fulfillment and refund line items carry only the line item id; the full line
// item is taken from the order's own line items (see attachLineItems).
const FULFILLMENT_FIELDS = `
    id name status displayStatus createdAt updatedAt
    location { id } service { handle }
    trackingInfo { company number url }
    fulfillmentLineItems(first: 50) { nodes { id quantity lineItem { id } } }`;

const REFUND_FIELDS = `
    id note createdAt processedAt
    return { id }
    refundLineItems(first: 50) { nodes {
        id quantity restockType restocked location { id }
        subtotalSet { ${MONEY} } totalTaxSet { ${MONEY} } lineItem { id }
    } }
    transactions(first: 10) { nodes {
        id kind status gateway test createdAt processedAt errorCode paymentId
        amountSet { ${MONEY} } parentTransaction { id }
    } }
    orderAdjustments(first: 10) { nodes { id reason amountSet { ${MONEY} } taxAmountSet { ${MONEY} } } }`;

const LINE_ITEMS_PAGE = 50;

// A page of full orders costs ~870 points at 50 and exceeds the 1000-point
// single query limit at ~60; larger REST limits are served in 50-order pages.
const MAX_ORDERS_PAGE = 50;

const ORDER_FIELDS = `
    id name number email phone note tags currencyCode presentmentCurrencyCode
    createdAt updatedAt processedAt cancelledAt cancelReason closedAt confirmed test
    displayFinancialStatus displayFulfillmentStatus taxesIncluded customerAcceptsMarketing customerLocale
    sourceName sourceIdentifier statusPageUrl paymentGatewayNames discountCodes totalWeight clientIp cartToken checkoutToken
    app { id }
    retailLocation { id }
    subtotalPriceSet { ${MONEY} }
    totalPriceSet { ${MONEY} }
    totalTaxSet { ${MONEY} }
    totalDiscountsSet { ${MONEY} }
    totalShippingPriceSet { ${MONEY} }
    totalTipReceivedSet { ${MONEY} }
    customAttributes { key value }
    customer {
        id firstName lastName state note tags taxExempt verifiedEmail createdAt updatedAt
        defaultEmailAddress { emailAddress } defaultPhoneNumber { phoneNumber }
    }
    billingAddress { ${client.ADDRESS_FIELDS} }
    shippingAddress { ${client.ADDRESS_FIELDS} }
    taxLines { ${TAX_LINE_FIELDS} }
    shippingLines(first: 10) { nodes {
        id title code source carrierIdentifier phone deliveryCategory
        originalPriceSet { ${MONEY} } discountedPriceSet { ${MONEY} } taxLines { ${TAX_LINE_FIELDS} }
    } }
    discountApplications(first: 10) { nodes {
        kind: __typename allocationMethod targetSelection targetType
        value { kind: __typename ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
        ... on DiscountCodeApplication { code }
        ... on ManualDiscountApplication { title description }
        ... on ScriptDiscountApplication { title }
        ... on AutomaticDiscountApplication { title }
    } }
    lineItems(first: ${LINE_ITEMS_PAGE}) { nodes { ${LINE_ITEM_FIELDS} } pageInfo { hasNextPage endCursor } }
    fulfillments(first: 10) { ${FULFILLMENT_FIELDS} }
    refunds(first: 10) { ${REFUND_FIELDS} }`;

const GET_ORDER = `query GetOrder($id: ID!) {
    order(id: $id) { ${ORDER_FIELDS} }
}`;

const LIST_ORDERS = `query ListOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
    orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${ORDER_FIELDS} }
        pageInfo { hasNextPage endCursor }
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

const LIST_FULFILLMENTS = `query OrderFulfillments($id: ID!, $first: Int!) {
    order(id: $id) {
        id
        fulfillments(first: $first) { ${FULFILLMENT_FIELDS} }
        lineItems(first: 250) { nodes { ${LINE_ITEM_FIELDS} } }
    }
}`;

const LIST_REFUNDS = `query OrderRefunds($id: ID!, $first: Int!) {
    order(id: $id) {
        id
        refunds(first: $first) { ${REFUND_FIELDS} }
        lineItems(first: 250) { nodes { ${LINE_ITEM_FIELDS} } }
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

// REST `order: 'created_at DESC'` field → OrderSortKeys.
const SORTS = {
    'created_at': 'CREATED_AT',
    'updated_at': 'UPDATED_AT',
    'processed_at': 'PROCESSED_AT',
    'id': 'ID',
    'name': 'ORDER_NUMBER',
    'order_number': 'ORDER_NUMBER',
    'total_price': 'TOTAL_PRICE'
};

// REST fulfillment_status filter → order search value. 'any' means no filter.
const FULFILLMENT_FILTERS = ['shipped', 'partial', 'unshipped', 'unfulfilled', 'fulfilled', 'scheduled', 'on_hold', 'request_declined'];

const FINANCIAL_FILTERS = ['authorized', 'pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded', 'voided', 'expired'];

// REST `financial_status: unpaid` = everything not paid yet.
const UNPAID = '(financial_status:authorized OR financial_status:pending OR financial_status:partially_paid)';

// OrderDisplayFulfillmentStatus → REST order fulfillment_status (null = unfulfilled).
const FULFILLMENT_STATUS = {
    FULFILLED: 'fulfilled',
    PARTIALLY_FULFILLED: 'partial',
    RESTOCKED: 'restocked'
};

// FulfillmentDisplayStatus values the REST shipment_status knew.
const SHIPMENT_STATUSES = ['label_printed', 'label_purchased', 'attempted_delivery', 'ready_for_pickup',
    'picked_up', 'confirmed', 'in_transit', 'out_for_delivery', 'delivered', 'failure', 'carrier_picked_up'];

const GRAMS_PER_UNIT = { GRAMS: 1, KILOGRAMS: 1000, OUNCES: 28.349523125, POUNDS: 453.59237 };

function decimal(value) {

    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : String(value);
}

// MoneyBag → REST price_set { shop_money, presentment_money }.
function moneySet(bag) {

    if (!bag) return null;
    const side = money => (money ? { amount: decimal(money.amount), currency_code: money.currencyCode || null } : null);
    return { shop_money: side(bag.shopMoney), presentment_money: side(bag.presentmentMoney) };
}

function amount(bag) {

    return decimal(client.money(bag));
}

function grams(weight) {

    if (!weight || weight.value === null || weight.value === undefined) return null;
    return Math.round(weight.value * (GRAMS_PER_UNIT[weight.unit] || 1));
}

function attributes(list) {

    return (list || []).map(({ key, value }) => ({ name: key, value }));
}

function toRestTaxLine(tax) {

    return {
        title: tax.title,
        rate: tax.rate,
        price: amount(tax.priceSet),
        price_set: moneySet(tax.priceSet),
        channel_liable: tax.channelLiable === undefined ? null : tax.channelLiable
    };
}

/**
 * GraphQL LineItem → REST line item.
 * @param {object} node
 * @returns {object}
 */
function toRestLineItem(node) {

    const current = node.currentQuantity === undefined ? node.quantity : node.currentQuantity;
    // unfulfilledQuantity still counts refunded units; REST fulfillable_quantity does not.
    const unfulfilled = Math.max(0, Math.min(node.unfulfilledQuantity || 0, current));
    let fulfillmentStatus = null;
    if (current > 0 && unfulfilled === 0) fulfillmentStatus = 'fulfilled';
    else if (unfulfilled > 0 && unfulfilled < current) fulfillmentStatus = 'partial';

    return {
        id: client.fromGid(node.id),
        admin_graphql_api_id: node.id,
        variant_id: node.variant ? client.fromGid(node.variant.id) : null,
        product_id: node.product ? client.fromGid(node.product.id) : null,
        product_exists: !!node.product,
        title: node.title,
        variant_title: node.variantTitle || null,
        name: node.name,
        quantity: node.quantity,
        current_quantity: current,
        price: amount(node.originalUnitPriceSet),
        price_set: moneySet(node.originalUnitPriceSet),
        sku: node.sku || null,
        vendor: node.vendor || null,
        taxable: node.taxable,
        requires_shipping: node.requiresShipping,
        gift_card: !!node.isGiftCard,
        grams: grams(node.weight),
        fulfillable_quantity: unfulfilled,
        fulfillment_status: fulfillmentStatus,
        fulfillment_service: null,
        total_discount: amount(node.totalDiscountSet),
        total_discount_set: moneySet(node.totalDiscountSet),
        properties: attributes(node.customAttributes),
        tax_lines: (node.taxLines || []).map(toRestTaxLine)
    };
}

function lineItemLookup(lineItems) {

    const byGid = new Map();
    for (const item of lineItems || []) byGid.set(item.admin_graphql_api_id, item);
    return gid => byGid.get(gid) || { id: client.fromGid(gid), admin_graphql_api_id: gid };
}

/**
 * GraphQL Fulfillment → REST fulfillment.
 * @param {object} node
 * @param {number} orderId
 * @param {Array} lineItems the order's REST line items, to expand fulfillment line items
 * @returns {object}
 */
function toRestFulfillment(node, orderId, lineItems) {

    const lineItem = lineItemLookup(lineItems);
    const tracking = node.trackingInfo || [];
    const shipment = client.enumValue(node.displayStatus);

    return {
        id: client.fromGid(node.id),
        admin_graphql_api_id: node.id,
        order_id: orderId,
        name: node.name,
        status: client.enumValue(node.status),
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        service: node.service ? node.service.handle : null,
        location_id: node.location ? client.fromGid(node.location.id) : null,
        shipment_status: SHIPMENT_STATUSES.includes(shipment) ? shipment : null,
        tracking_company: tracking.length ? tracking[0].company || null : null,
        tracking_number: tracking.length ? tracking[0].number || null : null,
        tracking_numbers: tracking.map(info => info.number).filter(Boolean),
        tracking_url: tracking.length ? tracking[0].url || null : null,
        tracking_urls: tracking.map(info => info.url).filter(Boolean),
        line_items: ((node.fulfillmentLineItems && node.fulfillmentLineItems.nodes) || []).map(item => ({
            ...lineItem(item.lineItem.id),
            quantity: item.quantity
        }))
    };
}

/**
 * GraphQL Refund → REST refund.
 * @param {object} node
 * @param {number} orderId
 * @param {Array} lineItems the order's REST line items, to expand refund line items
 * @returns {object}
 */
function toRestRefund(node, orderId, lineItems) {

    const lineItem = lineItemLookup(lineItems);
    const nodes = connection => (connection && connection.nodes) || [];
    const refundId = client.fromGid(node.id);
    const refundLineItems = nodes(node.refundLineItems).map(item => {
        const full = lineItem(item.lineItem.id);
        return {
            id: client.fromGid(item.id),
            line_item_id: full.id,
            line_item: full,
            quantity: item.quantity,
            restock_type: client.enumValue(item.restockType),
            location_id: item.location ? client.fromGid(item.location.id) : null,
            subtotal: Number(amount(item.subtotalSet)),
            subtotal_set: moneySet(item.subtotalSet),
            total_tax: Number(amount(item.totalTaxSet)),
            total_tax_set: moneySet(item.totalTaxSet)
        };
    });

    return {
        id: refundId,
        admin_graphql_api_id: node.id,
        order_id: orderId,
        created_at: node.createdAt,
        processed_at: node.processedAt,
        note: node.note || null,
        user_id: null,
        restock: nodes(node.refundLineItems).some(item => item.restocked),
        duties: [],
        total_duties_set: null,
        return: node.return ? { id: client.fromGid(node.return.id), admin_graphql_api_id: node.return.id } : null,
        refund_shipping_lines: [],
        refund_line_items: refundLineItems,
        transactions: nodes(node.transactions).map(transaction => ({
            id: client.fromGid(transaction.id),
            admin_graphql_api_id: transaction.id,
            order_id: orderId,
            kind: client.enumValue(transaction.kind),
            status: client.enumValue(transaction.status),
            gateway: transaction.gateway || null,
            amount: amount(transaction.amountSet),
            currency: transaction.amountSet && transaction.amountSet.presentmentMoney
                ? transaction.amountSet.presentmentMoney.currencyCode
                : null,
            test: transaction.test,
            created_at: transaction.createdAt,
            processed_at: transaction.processedAt || null,
            error_code: client.enumValue(transaction.errorCode),
            payment_id: transaction.paymentId || null,
            parent_id: transaction.parentTransaction ? client.fromGid(transaction.parentTransaction.id) : null
        })),
        order_adjustments: nodes(node.orderAdjustments).map(adjustment => ({
            id: client.fromGid(adjustment.id),
            order_id: orderId,
            refund_id: refundId,
            kind: 'refund_discrepancy',
            reason: client.enumValue(adjustment.reason),
            amount: amount(adjustment.amountSet),
            amount_set: moneySet(adjustment.amountSet),
            tax_amount: amount(adjustment.taxAmountSet),
            tax_amount_set: moneySet(adjustment.taxAmountSet)
        }))
    };
}

function toRestDiscountApplication(node) {

    const value = node.value || {};
    const percentage = value.kind === 'PricingPercentageValue';
    const types = {
        DiscountCodeApplication: 'discount_code',
        ManualDiscountApplication: 'manual',
        ScriptDiscountApplication: 'script',
        AutomaticDiscountApplication: 'automatic'
    };

    return {
        type: types[node.kind] || null,
        code: node.code || undefined,
        title: node.title || node.code || null,
        description: node.description || node.title || node.code || null,
        value: percentage ? String(value.percentage) : decimal(value.amount),
        value_type: percentage ? 'percentage' : 'fixed_amount',
        allocation_method: client.enumValue(node.allocationMethod),
        target_selection: client.enumValue(node.targetSelection),
        target_type: client.enumValue(node.targetType)
    };
}

/**
 * REST discount_codes [{ code, amount, type }]. The codes come from
 * Order.discountCodes; a code the shop does not know (given at order creation)
 * is applied as a manual discount titled with the code.
 * @param {string[]} codes
 * @param {Array} applications REST discount applications
 * @param {string} totalDiscounts
 * @returns {Array}
 */
function toRestDiscountCodes(codes, applications, totalDiscounts) {

    return (codes || []).map(code => {
        const application = applications.find(item => item.code === code)
            || applications.find(item => item.type === 'manual' && item.title === code);
        if (!application) return { code, amount: null, type: null };
        const type = application.target_type === 'shipping_line' ? 'shipping' : application.value_type;
        // REST reports the money amount the code took off; GraphQL has it only
        // as the order total when this code is the order's only discount.
        const discountAmount = applications.length === 1 ? totalDiscounts : application.value;
        return { code, amount: discountAmount, type };
    });
}

function toRestCustomer(node) {

    if (!node) return null;
    return {
        id: client.fromGid(node.id),
        email: node.defaultEmailAddress ? node.defaultEmailAddress.emailAddress : null,
        first_name: node.firstName,
        last_name: node.lastName,
        phone: node.defaultPhoneNumber ? node.defaultPhoneNumber.phoneNumber : null,
        state: client.enumValue(node.state),
        note: node.note,
        tags: client.tagString(node.tags),
        tax_exempt: !!node.taxExempt,
        verified_email: !!node.verifiedEmail,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        admin_graphql_api_id: node.id
    };
}

// Sum of unit price × ordered quantity over all line items, in both currencies.
function lineItemsTotal(lineItems) {

    const sum = side => {
        let total = 0;
        let currency = null;
        for (const item of lineItems) {
            const money = item.price_set && item.price_set[side];
            if (!money) return null;
            total += Number(money.amount) * item.quantity;
            currency = money.currency_code;
        }
        return { amount: total.toFixed(2), currency_code: currency };
    };
    if (!lineItems.length) return null;
    return { shop_money: sum('shop_money'), presentment_money: sum('presentment_money') };
}

/**
 * GraphQL Order → REST order.
 * @param {object} node
 * @param {Array} [allLineItems] GraphQL line items when the order had more than one page of them
 * @returns {object|null}
 */
function toRestOrder(node, allLineItems) {

    if (!node) return null;

    const id = client.fromGid(node.id);
    const lineItems = (allLineItems || (node.lineItems && node.lineItems.nodes) || []).map(toRestLineItem);
    const discountApplications = ((node.discountApplications && node.discountApplications.nodes) || [])
        .map(toRestDiscountApplication);
    const totalDiscounts = amount(node.totalDiscountsSet);
    const totalLineItemsSet = lineItemsTotal(lineItems);
    const tip = node.totalTipReceivedSet;

    return {
        id,
        admin_graphql_api_id: node.id,
        name: node.name,
        // GraphQL `number` is the REST order_number (starts at 1001); REST
        // `number` is the same sequence starting at 1.
        order_number: node.number,
        number: typeof node.number === 'number' ? node.number - 1000 : null,
        email: node.email || null,
        contact_email: node.email || null,
        phone: node.phone || null,
        note: node.note || null,
        tags: client.tagString(node.tags),
        currency: node.currencyCode,
        presentment_currency: node.presentmentCurrencyCode,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        processed_at: node.processedAt,
        cancelled_at: node.cancelledAt || null,
        cancel_reason: client.enumValue(node.cancelReason),
        closed_at: node.closedAt || null,
        confirmed: node.confirmed,
        test: node.test,
        financial_status: client.enumValue(node.displayFinancialStatus),
        fulfillment_status: FULFILLMENT_STATUS[node.displayFulfillmentStatus] || null,
        taxes_included: node.taxesIncluded,
        buyer_accepts_marketing: node.customerAcceptsMarketing,
        customer_locale: node.customerLocale || null,
        source_name: node.sourceName || null,
        source_identifier: node.sourceIdentifier || null,
        order_status_url: node.statusPageUrl || null,
        app_id: node.app ? client.fromGid(node.app.id) : null,
        location_id: node.retailLocation ? client.fromGid(node.retailLocation.id) : null,
        payment_gateway_names: node.paymentGatewayNames || [],
        gateway: node.paymentGatewayNames && node.paymentGatewayNames.length ? node.paymentGatewayNames[0] : null,
        browser_ip: node.clientIp || null,
        client_details: node.clientIp ? {
            browser_ip: node.clientIp,
            accept_language: null, browser_height: null, browser_width: null, session_hash: null, user_agent: null
        } : null,
        cart_token: node.cartToken || null,
        checkout_token: node.checkoutToken || null,
        subtotal_price: amount(node.subtotalPriceSet),
        subtotal_price_set: moneySet(node.subtotalPriceSet),
        total_price: amount(node.totalPriceSet),
        total_price_set: moneySet(node.totalPriceSet),
        total_tax: amount(node.totalTaxSet),
        total_tax_set: moneySet(node.totalTaxSet),
        total_discounts: totalDiscounts,
        total_discounts_set: moneySet(node.totalDiscountsSet),
        total_line_items_price: totalLineItemsSet && totalLineItemsSet.shop_money
            ? totalLineItemsSet.shop_money.amount
            : null,
        total_line_items_price_set: totalLineItemsSet,
        total_shipping_price_set: moneySet(node.totalShippingPriceSet),
        total_tip_received: tip ? amount(tip) : null,
        total_weight: node.totalWeight === null || node.totalWeight === undefined ? null : Number(node.totalWeight),
        note_attributes: attributes(node.customAttributes),
        customer: toRestCustomer(node.customer),
        billing_address: client.address(node.billingAddress),
        shipping_address: client.address(node.shippingAddress),
        line_items: lineItems,
        shipping_lines: ((node.shippingLines && node.shippingLines.nodes) || []).map(line => ({
            id: client.fromGid(line.id),
            title: line.title,
            code: line.code || null,
            source: line.source || null,
            carrier_identifier: line.carrierIdentifier || null,
            phone: line.phone || null,
            delivery_category: line.deliveryCategory || null,
            price: amount(line.originalPriceSet),
            price_set: moneySet(line.originalPriceSet),
            discounted_price: amount(line.discountedPriceSet),
            discounted_price_set: moneySet(line.discountedPriceSet),
            tax_lines: (line.taxLines || []).map(toRestTaxLine)
        })),
        tax_lines: (node.taxLines || []).map(toRestTaxLine),
        discount_applications: discountApplications,
        discount_codes: toRestDiscountCodes(node.discountCodes, discountApplications, totalDiscounts),
        fulfillments: (node.fulfillments || []).map(fulfillment => toRestFulfillment(fulfillment, id, lineItems)),
        refunds: (node.refunds || []).map(refund => toRestRefund(refund, id, lineItems)),
        // Not available on the GraphQL Admin API.
        token: null,
        user_id: null,
        landing_site: null,
        referring_site: null,
        payment_details: null,
        processing_method: null
    };
}

// REST date filter value → ISO timestamp for the search query (also keeps
// arbitrary text out of the query string).
function isoDate(value, name) {

    const date = value instanceof Date ? value : new Date(value);
    if (!(value instanceof Date) && !/^\d{4}-\d{2}-\d{2}/.test(String(value).trim()) || Number.isNaN(date.getTime())) {
        throw new client.ShopifyError(`${name} must be a date, got "${value}".`, 422);
    }
    return date.toISOString();
}

function numericId(value, name) {

    const id = client.fromGid(typeof value === 'string' ? value.trim() : value);
    if (!/^\d+$/.test(String(id))) {
        throw new client.ShopifyError(`${name} must be a numeric id, got "${value}".`, 422);
    }
    return id;
}

/**
 * REST order list filters → order search syntax. REST lists only open orders
 * when no status is given; so does this.
 * @param {object} params
 * @returns {string|undefined}
 */
function searchFrom(params = {}) {

    const terms = [];
    const status = params.status ? String(params.status).toLowerCase() : 'open';
    if (['open', 'closed', 'cancelled'].includes(status)) {
        terms.push(`status:${status}`);
    } else if (status !== 'any') {
        throw new client.ShopifyError(`Unsupported order status "${params.status}".`, 422);
    }

    const financial = params.financial_status ? String(params.financial_status).toLowerCase() : 'any';
    if (financial === 'unpaid') {
        terms.push(UNPAID);
    } else if (FINANCIAL_FILTERS.includes(financial)) {
        terms.push(`financial_status:${financial}`);
    } else if (financial !== 'any') {
        throw new client.ShopifyError(`Unsupported financial status "${params.financial_status}".`, 422);
    }

    const fulfillment = params.fulfillment_status ? String(params.fulfillment_status).toLowerCase() : 'any';
    if (FULFILLMENT_FILTERS.includes(fulfillment)) {
        terms.push(`fulfillment_status:${fulfillment}`);
    } else if (fulfillment !== 'any') {
        throw new client.ShopifyError(`Unsupported fulfillment status "${params.fulfillment_status}".`, 422);
    }

    if (params.customer_id) terms.push(`customer_id:${numericId(params.customer_id, 'customer_id')}`);
    if (params.ids) {
        const ids = String(params.ids).split(',').filter(id => id.trim()).map(id => `id:${numericId(id, 'ids')}`);
        if (ids.length) terms.push(`(${ids.join(' OR ')})`);
    }
    if (params.since_id) terms.push(`id:>${numericId(params.since_id, 'since_id')}`);
    if (params.created_at_min) terms.push(`created_at:>='${isoDate(params.created_at_min, 'created_at_min')}'`);
    if (params.created_at_max) terms.push(`created_at:<='${isoDate(params.created_at_max, 'created_at_max')}'`);
    if (params.updated_at_min) terms.push(`updated_at:>='${isoDate(params.updated_at_min, 'updated_at_min')}'`);
    if (params.updated_at_max) terms.push(`updated_at:<='${isoDate(params.updated_at_max, 'updated_at_max')}'`);
    if (params.processed_at_min) terms.push(`processed_at:>='${isoDate(params.processed_at_min, 'processed_at_min')}'`);
    if (params.processed_at_max) terms.push(`processed_at:<='${isoDate(params.processed_at_max, 'processed_at_max')}'`);

    return terms.length ? terms.join(' AND ') : undefined;
}

// REST `order: 'updated_at DESC'` → { sortKey, reverse }. Without one, newest first.
function sortFrom(order) {

    if (!order) return { sortKey: 'CREATED_AT', reverse: true };
    const [field, direction = 'asc'] = String(order).trim().split(/\s+/);
    const sortKey = SORTS[field.toLowerCase()];
    if (!sortKey) {
        throw new client.ShopifyError(`Unsupported order sort "${order}".`, 422);
    }
    return { sortKey, reverse: direction.toLowerCase() === 'desc' };
}

function toBoolean(value) {

    if (value === 'true') return true;
    if (value === 'false') return false;
    return typeof value === 'boolean' ? value : undefined;
}

function present(value) {

    return value !== undefined && value !== null && value !== '';
}

function upperEnum(value) {

    return present(value) ? String(value).trim().toUpperCase() : undefined;
}

/**
 * REST CreateOrder payload → OrderCreateOrderInput. `currency` is the shop
 * currency used for the prices the payload carries.
 * @param {object} payload
 * @param {string} currency
 * @returns {object}
 */
function toOrderCreateInput(payload, currency) {

    const input = {};
    const bag = value => ({ shopMoney: { amount: String(value), currencyCode: currency } });
    const set = (key, value) => {
        if (present(value)) input[key] = value;
    };

    set('email', payload.email);
    set('phone', payload.phone);
    set('note', payload.note);
    set('currency', upperEnum(payload.currency));
    set('test', toBoolean(payload.test));
    set('buyerAcceptsMarketing', toBoolean(payload.buyer_accepts_marketing));
    set('taxesIncluded', toBoolean(payload.taxes_included));
    set('financialStatus', upperEnum(payload.financial_status));
    set('fulfillmentStatus', payload.fulfillment_status === 'null' ? undefined : upperEnum(payload.fulfillment_status));
    if (present(payload.tags)) input.tags = client.tagList(payload.tags);

    const customer = payload.customer;
    if (customer && present(customer.id)) {
        input.customer = { toAssociate: { id: client.toGid('Customer', customer.id) } };
    } else if (customer) {
        const toUpsert = {};
        if (present(customer.email)) toUpsert.email = customer.email;
        if (present(customer.first_name)) toUpsert.firstName = customer.first_name;
        if (present(customer.last_name)) toUpsert.lastName = customer.last_name;
        if (present(customer.phone)) toUpsert.phone = customer.phone;
        if (Object.keys(toUpsert).length) input.customer = { toUpsert };
    }

    input.lineItems = (payload.line_items || []).map(item => {
        const line = { quantity: parseInt(item.quantity, 10) || 1 };
        if (present(item.variant_id)) line.variantId = client.toGid('ProductVariant', item.variant_id);
        if (present(item.product_id)) line.productId = client.toGid('Product', item.product_id);
        if (present(item.title)) line.title = item.title;
        if (present(item.variant_title)) line.variantTitle = item.variant_title;
        if (present(item.sku)) line.sku = item.sku;
        if (present(item.vendor)) line.vendor = item.vendor;
        if (present(item.price)) line.priceSet = bag(item.price);
        if (present(item.grams)) line.weight = { value: Number(item.grams), unit: 'GRAMS' };
        if (toBoolean(item.taxable) !== undefined) line.taxable = toBoolean(item.taxable);
        if (toBoolean(item.requires_shipping) !== undefined) line.requiresShipping = toBoolean(item.requires_shipping);
        return line;
    });

    const codes = (payload.discount_codes || []).filter(code => present(code.code));
    if (codes.length > 1) {
        throw new client.ShopifyError('An order can be created with one discount code only.', 422);
    }
    if (codes.length) {
        const { code, amount: value, type } = codes[0];
        if (type === 'percentage') {
            input.discountCode = { itemPercentageDiscountCode: { code, percentage: Number(value) } };
        } else if (type === 'shipping') {
            input.discountCode = { freeShippingDiscountCode: { code } };
        } else {
            input.discountCode = { itemFixedDiscountCode: { code, amountSet: bag(value) } };
        }
    }

    const taxLines = (payload.tax_lines || []).filter(tax => present(tax.title) && present(tax.rate));
    if (taxLines.length) {
        input.taxLines = taxLines.map(tax => ({
            title: tax.title,
            rate: String(tax.rate),
            ...(present(tax.price) ? { priceSet: bag(tax.price) } : {})
        }));
    }

    const billing = client.addressInput(payload.billing_address);
    if (billing) input.billingAddress = billing;
    const shipping = client.addressInput(payload.shipping_address);
    if (shipping) input.shippingAddress = shipping;

    return input;
}

/**
 * REST UpdateOrder payload → OrderInput. buyer_accepts_marketing cannot be
 * changed on an existing order through GraphQL and is ignored.
 * @param {number|string} id
 * @param {object} payload
 * @returns {object}
 */
function toOrderUpdateInput(id, payload) {

    const input = { id: client.toGid('Order', id) };
    if (present(payload.email)) input.email = payload.email;
    if (present(payload.phone)) input.phone = payload.phone;
    if (present(payload.note)) input.note = payload.note;
    if (present(payload.tags)) input.tags = client.tagList(payload.tags);
    const shipping = client.addressInput(payload.shipping_address);
    if (shipping) input.shippingAddress = shipping;
    return input;
}

// Whether the create payload carries a price, so the shop currency is needed.
function needsCurrency(payload) {

    return (payload.line_items || []).some(item => present(item.price))
        || (payload.tax_lines || []).some(tax => present(tax.price))
        || (payload.discount_codes || []).some(code => present(code.code) && code.type !== 'percentage' && code.type !== 'shipping');
}

module.exports = (run) => {

    // Orders with more line items than one page holds get the rest fetched here.
    async function remainingLineItems(node) {

        const page = node.lineItems;
        if (!page || !page.pageInfo || !page.pageInfo.hasNextPage) return undefined;
        const items = page.nodes.slice();
        let after = page.pageInfo.endCursor;
        while (after) {
            const data = await run(MORE_LINE_ITEMS, { id: node.id, after });
            const next = data.order.lineItems;
            items.push(...next.nodes);
            after = next.pageInfo.hasNextPage ? next.pageInfo.endCursor : null;
        }
        return items;
    }

    async function toOrder(node) {

        return toRestOrder(node, await remainingLineItems(node));
    }

    async function get(id) {

        const data = await run(GET_ORDER, { id: client.toGid('Order', id) });
        if (!data.order) {
            throw new client.ShopifyError(`Order ${id} not found.`, 404);
        }
        return toOrder(data.order);
    }

    async function list(params = {}) {

        const sort = sortFrom(params.order);
        const data = await run(LIST_ORDERS, {
            first: Math.min(client.pageSize(params.limit), MAX_ORDERS_PAGE),
            after: params.after || null,
            query: searchFrom(params) || null,
            sortKey: sort.sortKey,
            reverse: sort.reverse
        });
        const orders = [];
        for (const node of data.orders.nodes) {
            orders.push(await toOrder(node));
        }
        return client.toListResult(orders, data.orders.pageInfo, params);
    }

    async function orderChildren(query, key, orderId, params, mapper) {

        const data = await run(query, { id: client.toGid('Order', orderId), first: client.pageSize(params.limit) });
        if (!data.order) {
            throw new client.ShopifyError(`Order ${orderId} not found.`, 404);
        }
        const id = client.fromGid(data.order.id);
        const lineItems = data.order.lineItems.nodes.map(toRestLineItem);
        // Neither list is paginated on the order; one page is all there is.
        return client.toListResult(data.order[key].map(node => mapper(node, id, lineItems)), null, params);
    }

    return {

        order: {

            list,
            get,

            async count(params = {}) {

                const data = await run(COUNT_ORDERS, { query: searchFrom(params) || null });
                return data.ordersCount.count;
            },

            async create(payload = {}) {

                let currency = present(payload.currency) ? upperEnum(payload.currency) : null;
                if (!currency && needsCurrency(payload)) {
                    const shop = await run(SHOP_CURRENCY);
                    currency = shop.shop.currencyCode;
                }
                const data = await run(CREATE_ORDER, {
                    order: toOrderCreateInput(payload, currency),
                    // REST defaults: no receipt e-mails, inventory untouched.
                    options: { inventoryBehaviour: 'BYPASS', sendReceipt: false, sendFulfillmentReceipt: false }
                });
                const { order } = client.checkUserErrors(data.orderCreate, 'orderCreate');
                return get(order.id);
            },

            async update(id, payload = {}) {

                const data = await run(UPDATE_ORDER, { input: toOrderUpdateInput(id, payload) });
                client.checkUserErrors(data.orderUpdate, 'orderUpdate');
                return get(id);
            },

            async delete(id) {

                const data = await run(DELETE_ORDER, { orderId: client.toGid('Order', id) });
                const errors = (data.orderDelete && data.orderDelete.userErrors) || [];
                if (errors.some(error => error.code === 'NOT_FOUND')) {
                    throw new client.ShopifyError(`Order ${id} not found.`, 404, errors);
                }
                client.checkUserErrors(data.orderDelete, 'orderDelete');
                return {};
            }
        },

        refund: {

            async list(orderId, params = {}) {

                return orderChildren(LIST_REFUNDS, 'refunds', orderId, params, toRestRefund);
            }
        },

        fulfillment: {

            async list(orderId, params = {}) {

                return orderChildren(LIST_FULFILLMENTS, 'fulfillments', orderId, params, toRestFulfillment);
            }
        },

        // REST customers/{id}/orders.json: the customer's orders, open ones
        // unless a status is given.
        async listForCustomer(customerId, params = {}) {

            return list({ ...params, customer_id: numericId(customerId, 'customer id') });
        }
    };
};

module.exports.toRestOrder = toRestOrder;
module.exports.toRestLineItem = toRestLineItem;
module.exports.toRestFulfillment = toRestFulfillment;
module.exports.toRestRefund = toRestRefund;
module.exports.toOrderCreateInput = toOrderCreateInput;
module.exports.toOrderUpdateInput = toOrderUpdateInput;
module.exports.searchFrom = searchFrom;
module.exports.sortFrom = sortFrom;
module.exports.ORDER_FIELDS = ORDER_FIELDS;
