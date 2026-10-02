'use strict';

// Store-level resources on the GraphQL Admin API — shop, locations, inventory
// levels, abandoned checkouts, draft orders, webhook subscriptions and order
// returns — returned in the REST shapes the components were built on.

const client = require('./graphql-client');

const { fromGid, toGid, enumValue } = client;

const SHOP_FIELDS = `
    id name email contactEmail myshopifyDomain shopOwnerName currencyCode
    ianaTimezone timezoneOffset createdAt updatedAt weightUnit taxesIncluded taxShipping
    checkoutApiSupported setupRequired enabledPresentmentCurrencies transactionalSmsDisabled
    marketingSmsConsentEnabledAtCheckout
    primaryDomain { host }
    plan { publicDisplayName shopifyPlus }
    currencyFormats { moneyFormat moneyWithCurrencyFormat moneyInEmailsFormat moneyWithCurrencyInEmailsFormat }
    shopAddress { address1 address2 city province provinceCode country countryCodeV2 zip phone latitude longitude }`;

const GET_SHOP = `query GetShop {
    shop { ${SHOP_FIELDS} }
}`;

// `location` without an id is the shop's primary location. Asked separately:
// it needs read_locations, and shop.get() validates freshly issued tokens.
const GET_PRIMARY_LOCATION = `query GetPrimaryLocation {
    location { id }
}`;

const LOCATION_FIELDS = `
    id name isActive isFulfillmentService createdAt updatedAt
    address { address1 address2 city zip province provinceCode country countryCode phone }`;

const LIST_LOCATIONS = `query ListLocations($first: Int!, $after: String) {
    locations(first: $first, after: $after, includeInactive: true, includeLegacy: true) {
        nodes { ${LOCATION_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const LIST_INVENTORY_LEVELS = `query ListInventoryLevels($id: ID!, $first: Int!, $after: String, $query: String) {
    location(id: $id) {
        id
        inventoryLevels(first: $first, after: $after, query: $query) {
            nodes {
                id updatedAt
                item { id }
                quantities(names: ["available"]) { name quantity }
            }
            pageInfo { hasNextPage endCursor }
        }
    }
}`;

const CUSTOMER_FIELDS = `
    id firstName lastName note tags state taxExempt verifiedEmail createdAt updatedAt numberOfOrders locale
    amountSpent { amount currencyCode }
    defaultEmailAddress { emailAddress marketingState }
    defaultPhoneNumber { phoneNumber }
    defaultAddress { ${client.ADDRESS_FIELDS} }`;

const MONEY = 'shopMoney { amount currencyCode } presentmentMoney { amount currencyCode }';

const CHECKOUT_FIELDS = `
    id name abandonedCheckoutUrl createdAt updatedAt completedAt note taxesIncluded discountCodes
    customAttributes { key value }
    subtotalPriceSet { ${MONEY} }
    totalPriceSet { ${MONEY} }
    totalTaxSet { ${MONEY} }
    totalDiscountSet { ${MONEY} }
    totalLineItemsPriceSet { ${MONEY} }
    taxLines { title rate priceSet { ${MONEY} } }
    customer { ${CUSTOMER_FIELDS} }
    shippingAddress { ${client.ADDRESS_FIELDS} }
    billingAddress { ${client.ADDRESS_FIELDS} }
    lineItems(first: 50) {
        nodes {
            id title variantTitle quantity sku
            originalUnitPriceSet { ${MONEY} }
            originalTotalPriceSet { ${MONEY} }
            customAttributes { key value }
            product { id vendor }
            variant { id title }
        }
    }`;

const LIST_CHECKOUTS = `query ListAbandonedCheckouts($first: Int!, $after: String, $query: String, $sortKey: AbandonedCheckoutSortKeys, $reverse: Boolean) {
    abandonedCheckouts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${CHECKOUT_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const DRAFT_ORDER_FIELDS = `
    id name note2 email phone taxesIncluded taxExempt currencyCode presentmentCurrencyCode
    invoiceSentAt invoiceUrl createdAt updatedAt completedAt status tags
    order { id }
    customAttributes { key value }
    appliedDiscount { title description value valueType amountSet { ${MONEY} } }
    shippingLine { title shippingRateHandle custom originalPriceSet { ${MONEY} } }
    taxLines { title rate priceSet { ${MONEY} } }
    subtotalPriceSet { ${MONEY} }
    totalPriceSet { ${MONEY} }
    totalTaxSet { ${MONEY} }
    customer { ${CUSTOMER_FIELDS} }
    shippingAddress { ${client.ADDRESS_FIELDS} }
    billingAddress { ${client.ADDRESS_FIELDS} }
    lineItems(first: 50) {
        nodes {
            id name title variantTitle sku vendor quantity custom requiresShipping taxable isGiftCard
            weight { unit value }
            originalUnitPriceSet { ${MONEY} }
            customAttributes { key value }
            appliedDiscount { title description value valueType amountSet { ${MONEY} } }
            taxLines { title rate priceSet { ${MONEY} } }
            product { id }
            variant { id }
        }
    }`;

const LIST_DRAFT_ORDERS = `query ListDraftOrders($first: Int!, $after: String, $query: String, $sortKey: DraftOrderSortKeys, $reverse: Boolean) {
    draftOrders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${DRAFT_ORDER_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const WEBHOOK_FIELDS = 'id uri topic format createdAt updatedAt includeFields metafieldNamespaces apiVersion { handle }';

const LIST_WEBHOOKS = `query ListWebhookSubscriptions($first: Int!, $after: String, $uri: String, $topics: [WebhookSubscriptionTopic!]) {
    webhookSubscriptions(first: $first, after: $after, uri: $uri, topics: $topics) {
        nodes { ${WEBHOOK_FIELDS} }
        pageInfo { hasNextPage endCursor }
    }
}`;

const CREATE_WEBHOOK = `mutation CreateWebhookSubscription($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription { ${WEBHOOK_FIELDS} }
        userErrors { field message }
    }
}`;

const DELETE_WEBHOOK = `mutation DeleteWebhookSubscription($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
        deletedWebhookSubscriptionId
        userErrors { field message }
    }
}`;

const RETURN_FIELDS = `
    id name status totalQuantity createdAt closedAt requestApprovedAt
    order { id name }
    decline { reason note }
    returnLineItems(first: 50) {
        nodes {
            id quantity customerNote returnReasonNote
            returnReasonDefinition { handle name }
            ... on ReturnLineItem {
                fulfillmentLineItem { id lineItem { id } }
            }
        }
    }
    reverseFulfillmentOrders(first: 10) { nodes { id status } }`;

const ORDER_RETURNS = `query OrderReturns($id: ID!, $first: Int!) {
    order(id: $id) {
        id
        returns(first: $first, reverse: true) { nodes { ${RETURN_FIELDS} } }
    }
}`;

// REST `order` field → GraphQL sort key.
const CHECKOUT_SORT_KEYS = { created_at: 'CREATED_AT', id: 'ID', total_price: 'TOTAL_PRICE' };
const DRAFT_ORDER_SORT_KEYS = { id: 'ID', updated_at: 'UPDATED_AT', status: 'STATUS', total_price: 'TOTAL_PRICE' };

const WEIGHT_UNITS = { GRAMS: 'g', KILOGRAMS: 'kg', OUNCES: 'oz', POUNDS: 'lb' };
const GRAMS_PER_UNIT = { GRAMS: 1, KILOGRAMS: 1000, OUNCES: 28.349523125, POUNDS: 453.59237 };

// REST topics whose resource part contains an underscore. Everything else is
// split at the first underscore (ORDERS_PAID → orders/paid).
const COMPOUND_TOPIC_RESOURCES = [
    'app_purchases_one_time', 'app_subscriptions', 'bulk_operations', 'collection_listings',
    'collection_publications', 'company_contact_roles', 'company_contacts', 'company_locations',
    'customer_account_settings', 'customer_groups', 'customer_payment_methods', 'customer_tags',
    'customers_email_marketing_consent', 'customers_marketing_consent', 'delivery_promise_settings',
    'draft_orders', 'fulfillment_events', 'fulfillment_holds', 'fulfillment_orders', 'inventory_items',
    'inventory_levels', 'inventory_transfers', 'order_transactions', 'payment_schedules', 'payment_terms',
    'product_feeds', 'product_listings', 'product_publications', 'reverse_deliveries',
    'reverse_fulfillment_orders', 'scheduled_product_listings', 'selling_plan_groups',
    'subscription_billing_attempts', 'subscription_billing_cycle_edits', 'subscription_billing_cycles',
    'subscription_contracts', 'tender_transactions'
];

/**
 * REST money string with two decimals ("0.0" → "0.00").
 * @param {object} set MoneyBag or MoneyV2
 * @returns {string|null}
 */
function decimal(set) {

    const value = client.money(set);
    if (value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(2) : value;
}

function currencyOf(set) {

    return set && set.shopMoney ? set.shopMoney.currencyCode : null;
}

function nodesOf(connection) {

    return (connection && connection.nodes) || [];
}

function taxLines(lines) {

    return (lines || []).map(line => ({ title: line.title, rate: line.rate, price: decimal(line.priceSet) }));
}

function properties(attributes) {

    return (attributes || []).map(({ key, value }) => ({ name: key, value }));
}

/**
 * "-0400" → "-04:00".
 * @param {string} offset
 * @returns {string|null}
 */
function offsetWithColon(offset) {

    const match = String(offset || '').match(/^([+-])(\d{2}):?(\d{2})$/);
    return match ? `${match[1]}${match[2]}:${match[3]}` : null;
}

/**
 * GraphQL Shop → REST shop.
 * @param {object} shop
 * @param {object} [primaryLocation] the shop's primary Location ({ id })
 * @returns {object}
 */
function toRestShop(shop, primaryLocation) {

    if (!shop) return null;
    const address = shop.shopAddress || {};
    const formats = shop.currencyFormats || {};
    const plan = shop.plan || {};
    const offset = offsetWithColon(shop.timezoneOffset);
    const planDisplayName = plan.publicDisplayName || null;

    return {
        id: fromGid(shop.id),
        name: shop.name,
        email: shop.email,
        customer_email: shop.contactEmail || null,
        domain: shop.primaryDomain ? shop.primaryDomain.host : shop.myshopifyDomain,
        myshopify_domain: shop.myshopifyDomain,
        shop_owner: shop.shopOwnerName,
        address1: address.address1 || null,
        address2: address.address2 || null,
        city: address.city || null,
        zip: address.zip || null,
        province: address.province || null,
        province_code: address.provinceCode || null,
        country: address.countryCodeV2 || null,
        country_code: address.countryCodeV2 || null,
        country_name: address.country || null,
        phone: address.phone || null,
        latitude: address.latitude === undefined ? null : address.latitude,
        longitude: address.longitude === undefined ? null : address.longitude,
        currency: shop.currencyCode,
        enabled_presentment_currencies: shop.enabledPresentmentCurrencies || [],
        // REST answers with the Rails zone name ("Eastern Time (US & Canada)");
        // GraphQL only has the IANA name and the current offset.
        timezone: offset ? `(GMT${offset}) ${shop.ianaTimezone}` : shop.ianaTimezone,
        iana_timezone: shop.ianaTimezone,
        // GraphQL has no plan handle; derive one from the display name.
        plan_name: plan.shopifyPlus ? 'shopify_plus'
            : (planDisplayName ? planDisplayName.toLowerCase().replace(/\s+/g, '_') : null),
        plan_display_name: planDisplayName,
        primary_locale: null,
        primary_location_id: primaryLocation ? fromGid(primaryLocation.id) : null,
        money_format: formats.moneyFormat || null,
        money_with_currency_format: formats.moneyWithCurrencyFormat || null,
        money_in_emails_format: formats.moneyInEmailsFormat || null,
        money_with_currency_in_emails_format: formats.moneyWithCurrencyInEmailsFormat || null,
        weight_unit: WEIGHT_UNITS[shop.weightUnit] || enumValue(shop.weightUnit),
        taxes_included: shop.taxesIncluded,
        tax_shipping: shop.taxShipping,
        checkout_api_supported: shop.checkoutApiSupported,
        setup_required: shop.setupRequired,
        transactional_sms_disabled: shop.transactionalSmsDisabled,
        marketing_sms_consent_enabled_at_checkout: shop.marketingSmsConsentEnabledAtCheckout,
        created_at: shop.createdAt,
        updated_at: shop.updatedAt,
        admin_graphql_api_id: shop.id
    };
}

/**
 * GraphQL Location → REST location.
 * @param {object} node
 * @returns {object}
 */
function toRestLocation(node) {

    if (!node) return null;
    const address = node.address || {};
    return {
        id: fromGid(node.id),
        name: node.name,
        address1: address.address1 || null,
        address2: address.address2 || null,
        city: address.city || null,
        zip: address.zip || null,
        province: address.province || null,
        province_code: address.provinceCode || null,
        country: address.countryCode || null,
        country_code: address.countryCode || null,
        country_name: address.country || null,
        phone: address.phone || null,
        active: node.isActive,
        legacy: !!node.isFulfillmentService,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        admin_graphql_api_id: node.id
    };
}

/**
 * GraphQL InventoryLevel → REST inventory level.
 * @param {object} node
 * @param {string} locationGid
 * @returns {object}
 */
function toRestInventoryLevel(node, locationGid) {

    if (!node) return null;
    const available = (node.quantities || []).find(quantity => quantity.name === 'available');
    return {
        inventory_item_id: node.item ? fromGid(node.item.id) : null,
        location_id: fromGid(locationGid),
        available: available ? available.quantity : null,
        updated_at: node.updatedAt,
        admin_graphql_api_id: node.id
    };
}

/**
 * The customer embedded in checkouts and draft orders.
 * @param {object} node GraphQL Customer
 * @returns {object|null}
 */
function toRestCustomerSummary(node) {

    if (!node) return null;
    const email = node.defaultEmailAddress;
    const id = fromGid(node.id);
    return {
        id,
        email: email ? email.emailAddress : null,
        first_name: node.firstName,
        last_name: node.lastName,
        phone: node.defaultPhoneNumber ? node.defaultPhoneNumber.phoneNumber : null,
        state: enumValue(node.state),
        note: node.note,
        tags: client.tagString(node.tags),
        verified_email: !!node.verifiedEmail,
        tax_exempt: !!node.taxExempt,
        orders_count: Number(node.numberOfOrders || 0),
        total_spent: decimal(node.amountSpent),
        currency: node.amountSpent ? node.amountSpent.currencyCode : null,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        default_address: node.defaultAddress
            ? { ...client.address(node.defaultAddress), customer_id: id, default: true }
            : null,
        admin_graphql_api_id: node.id
    };
}

/**
 * The checkout token is not a field of AbandonedCheckout; it is carried in the
 * line item ids ("gid://shopify/AbandonedCheckoutLineItem/<key>?checkout=<token>&...").
 * Older recovery URLs hold it in the path (/checkouts/<token>/recover).
 * @param {object} node
 * @returns {string|null}
 */
function checkoutToken(node) {

    for (const item of nodesOf(node.lineItems)) {
        const match = String(item.id || '').match(/[?&]checkout=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
    }
    const legacy = String(node.abandonedCheckoutUrl || '').match(/\/checkouts\/(?!ac\/)([^/?]+)\/recover/);
    return legacy ? legacy[1] : null;
}

function urlParam(url, name) {

    try {
        return new URL(url).searchParams.get(name);
    } catch (err) {
        return null;
    }
}

/**
 * GraphQL AbandonedCheckout → REST checkout.
 * @param {object} node
 * @returns {object}
 */
function toRestCheckout(node) {

    if (!node) return null;
    const customer = toRestCustomerSummary(node.customer);
    const email = node.customer && node.customer.defaultEmailAddress;
    const cartToken = String(node.abandonedCheckoutUrl || '').match(/\/checkouts\/ac\/([^/?]+)/);

    return {
        id: fromGid(node.id),
        token: checkoutToken(node),
        cart_token: cartToken ? cartToken[1] : null,
        name: node.name,
        email: customer ? customer.email : null,
        phone: customer ? customer.phone : null,
        gateway: null,
        buyer_accepts_marketing: !!email && email.marketingState === 'SUBSCRIBED',
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        completed_at: node.completedAt || null,
        landing_site: null,
        note: node.note || null,
        note_attributes: properties(node.customAttributes),
        currency: currencyOf(node.totalPriceSet),
        presentment_currency: node.totalPriceSet && node.totalPriceSet.presentmentMoney
            ? node.totalPriceSet.presentmentMoney.currencyCode : null,
        customer_locale: urlParam(node.abandonedCheckoutUrl, 'locale') || (node.customer ? node.customer.locale : null),
        taxes_included: node.taxesIncluded,
        discount_codes: (node.discountCodes || []).map(code => ({ code })),
        line_items: nodesOf(node.lineItems).map(item => ({
            product_id: item.product ? fromGid(item.product.id) : null,
            variant_id: item.variant ? fromGid(item.variant.id) : null,
            title: item.title,
            variant_title: item.variantTitle || null,
            sku: item.sku || null,
            vendor: item.product ? item.product.vendor : null,
            quantity: item.quantity,
            price: decimal(item.originalUnitPriceSet),
            line_price: decimal(item.originalTotalPriceSet),
            properties: properties(item.customAttributes)
        })),
        abandoned_checkout_url: node.abandonedCheckoutUrl,
        subtotal_price: decimal(node.subtotalPriceSet),
        total_line_items_price: decimal(node.totalLineItemsPriceSet),
        total_discounts: decimal(node.totalDiscountSet),
        total_tax: decimal(node.totalTaxSet) || '0.00',
        total_price: decimal(node.totalPriceSet),
        tax_lines: taxLines(node.taxLines),
        customer,
        shipping_address: client.address(node.shippingAddress),
        billing_address: client.address(node.billingAddress)
    };
}

function appliedDiscount(discount) {

    if (!discount) return null;
    return {
        title: discount.title || null,
        description: discount.description,
        value: discount.value === null || discount.value === undefined ? null : String(discount.value),
        value_type: enumValue(discount.valueType),
        amount: decimal(discount.amountSet)
    };
}

function grams(weight) {

    if (!weight || !GRAMS_PER_UNIT[weight.unit]) return 0;
    return Math.round(weight.value * GRAMS_PER_UNIT[weight.unit]);
}

/**
 * GraphQL DraftOrder → REST draft order.
 * @param {object} node
 * @returns {object}
 */
function toRestDraftOrder(node) {

    if (!node) return null;
    const shipping = node.shippingLine;
    return {
        id: fromGid(node.id),
        name: node.name,
        note: node.note2 || null,
        email: node.email || null,
        phone: node.phone || null,
        taxes_included: node.taxesIncluded,
        tax_exempt: node.taxExempt,
        currency: node.currencyCode,
        presentment_currency: node.presentmentCurrencyCode,
        invoice_sent_at: node.invoiceSentAt || null,
        invoice_url: node.invoiceUrl || null,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        completed_at: node.completedAt || null,
        status: enumValue(node.status),
        order_id: node.order ? fromGid(node.order.id) : null,
        tags: client.tagString(node.tags),
        note_attributes: properties(node.customAttributes),
        applied_discount: appliedDiscount(node.appliedDiscount),
        shipping_line: shipping ? {
            title: shipping.title,
            custom: shipping.custom,
            handle: shipping.shippingRateHandle || null,
            price: decimal(shipping.originalPriceSet)
        } : null,
        tax_lines: taxLines(node.taxLines),
        line_items: nodesOf(node.lineItems).map(item => ({
            id: fromGid(item.id),
            variant_id: item.variant ? fromGid(item.variant.id) : null,
            product_id: item.product ? fromGid(item.product.id) : null,
            title: item.title,
            variant_title: item.variantTitle || null,
            name: item.name,
            sku: item.sku || null,
            vendor: item.vendor || null,
            quantity: item.quantity,
            requires_shipping: item.requiresShipping,
            taxable: item.taxable,
            gift_card: item.isGiftCard,
            custom: item.custom,
            grams: grams(item.weight),
            price: decimal(item.originalUnitPriceSet),
            properties: properties(item.customAttributes),
            applied_discount: appliedDiscount(item.appliedDiscount),
            tax_lines: taxLines(item.taxLines),
            admin_graphql_api_id: item.id
        })),
        subtotal_price: decimal(node.subtotalPriceSet),
        total_tax: decimal(node.totalTaxSet),
        total_price: decimal(node.totalPriceSet),
        customer: toRestCustomerSummary(node.customer),
        shipping_address: client.address(node.shippingAddress),
        billing_address: client.address(node.billingAddress),
        admin_graphql_api_id: node.id
    };
}

/**
 * REST webhook topic → GraphQL enum (orders/create → ORDERS_CREATE).
 * @param {string} topic
 * @returns {string}
 */
function toTopicEnum(topic) {

    return String(topic || '').trim().toUpperCase().replace(/\//g, '_');
}

/**
 * GraphQL enum → REST webhook topic (DRAFT_ORDERS_CREATE → draft_orders/create).
 * @param {string} topic
 * @returns {string}
 */
function fromTopicEnum(topic) {

    const value = String(topic || '').toLowerCase();
    const compound = COMPOUND_TOPIC_RESOURCES
        .filter(resource => value.startsWith(resource + '_'))
        .sort((a, b) => b.length - a.length)[0];
    if (compound) {
        return `${compound}/${value.slice(compound.length + 1)}`;
    }
    const index = value.indexOf('_');
    return index === -1 ? value : `${value.slice(0, index)}/${value.slice(index + 1)}`;
}

/**
 * GraphQL WebhookSubscription → REST webhook.
 * @param {object} node
 * @returns {object}
 */
function toRestWebhook(node) {

    if (!node) return null;
    return {
        id: fromGid(node.id),
        address: node.uri,
        topic: fromTopicEnum(node.topic),
        format: enumValue(node.format),
        fields: node.includeFields || [],
        metafield_namespaces: node.metafieldNamespaces || [],
        api_version: node.apiVersion ? node.apiVersion.handle : null,
        created_at: node.createdAt,
        updated_at: node.updatedAt,
        admin_graphql_api_id: node.id
    };
}

/**
 * GraphQL Return → the REST shape of the returns/* webhook payload.
 * @param {object} node
 * @returns {object}
 */
function toRestReturn(node) {

    if (!node) return null;
    const order = node.order || null;
    return {
        id: fromGid(node.id),
        order_id: order ? fromGid(order.id) : null,
        status: enumValue(node.status),
        name: node.name,
        total_quantity: node.totalQuantity,
        created_at: node.createdAt,
        closed_at: node.closedAt || null,
        request_approved_at: node.requestApprovedAt || null,
        decline: node.decline ? { reason: enumValue(node.decline.reason), note: node.decline.note || null } : null,
        return_line_items: nodesOf(node.returnLineItems).map(item => {
            const fulfillmentLineItem = item.fulfillmentLineItem || null;
            const lineItem = fulfillmentLineItem && fulfillmentLineItem.lineItem;
            const reason = item.returnReasonDefinition || null;
            return {
                id: fromGid(item.id),
                quantity: item.quantity,
                return_reason: reason ? reason.handle : null,
                return_reason_name: reason ? reason.name : null,
                return_reason_note: item.returnReasonNote || null,
                customer_note: item.customerNote || null,
                fulfillment_line_item_id: fulfillmentLineItem ? fromGid(fulfillmentLineItem.id) : null,
                line_item_id: lineItem ? fromGid(lineItem.id) : null,
                admin_graphql_api_id: item.id
            };
        }),
        reverse_fulfillment_orders: nodesOf(node.reverseFulfillmentOrders).map(rfo => ({
            id: fromGid(rfo.id),
            status: enumValue(rfo.status),
            admin_graphql_api_id: rfo.id
        })),
        order: order ? { id: fromGid(order.id), name: order.name, admin_graphql_api_id: order.id } : null,
        admin_graphql_api_id: node.id
    };
}

// --- REST list parameters → GraphQL search syntax --------------------------

function quote(value) {

    return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`;
}

function idList(value) {

    if (value === undefined || value === null || value === '') return [];
    const list = Array.isArray(value) ? value : String(value).split(',');
    return list.map(id => String(fromGid(String(id).trim()))).filter(Boolean);
}

function idFilters(params) {

    const terms = [];
    if (params.since_id) terms.push(`id:>${quote(fromGid(params.since_id))}`);
    const ids = idList(params.ids);
    if (ids.length) terms.push('(' + ids.map(id => `id:${quote(id)}`).join(' OR ') + ')');
    return terms;
}

// Date filters common to REST list endpoints: created_at_*, updated_at_*.
function dateFilters(params) {

    const terms = [];
    if (params.created_at_min) terms.push(`created_at:>=${quote(params.created_at_min)}`);
    if (params.created_at_max) terms.push(`created_at:<=${quote(params.created_at_max)}`);
    if (params.updated_at_min) terms.push(`updated_at:>=${quote(params.updated_at_min)}`);
    if (params.updated_at_max) terms.push(`updated_at:<=${quote(params.updated_at_max)}`);
    return terms;
}

function joinQuery(terms) {

    return terms.length ? terms.join(' AND ') : null;
}

// The `id` search field of abandonedCheckouts is an internal id, not the one
// the API returns, so since_id/ids are applied to the fetched page instead.
function checkoutQuery(params = {}) {

    const terms = dateFilters(params);
    // REST status: open (default) | closed; GraphQL has no "any", so leave it out.
    if (params.status && params.status !== 'any') terms.push(`status:${quote(params.status)}`);
    return joinQuery(terms);
}

function draftOrderQuery(params = {}) {

    const terms = [...idFilters(params), ...dateFilters(params)];
    if (params.status && params.status !== 'any') terms.push(`status:${quote(params.status)}`);
    return joinQuery(terms);
}

/**
 * REST `order` ("updated_at desc") → { sortKey, reverse }. Without an order the
 * newest records come first.
 * @param {string} order
 * @param {object} keys REST field → GraphQL sort key
 * @param {string} fallback sort key used without an order
 * @returns {{ sortKey: string, reverse: boolean }}
 */
function sortFrom(order, keys, fallback) {

    const [field, direction] = String(order || '').trim().toLowerCase().split(/\s+/);
    if (field && keys[field]) {
        return { sortKey: keys[field], reverse: direction === 'desc' };
    }
    return { sortKey: fallback, reverse: true };
}

module.exports = (run) => {

    const listPage = async (query, connection, params, variables, map, filter) => {

        const data = await run(query, {
            first: client.pageSize(params.limit),
            after: params.after || null,
            ...variables
        });
        const result = data[connection];
        let items = nodesOf(result).map(map);
        if (filter) items = items.filter(filter);
        return client.toListResult(items, result.pageInfo, params);
    };

    const listLocations = (params = {}) => listPage(LIST_LOCATIONS, 'locations', params, {}, toRestLocation);

    const allLocationIds = async () => {

        const ids = [];
        let after = null;
        do {
            const data = await run(LIST_LOCATIONS, { first: 250, after });
            ids.push(...nodesOf(data.locations).map(location => location.id));
            after = data.locations.pageInfo.hasNextPage ? data.locations.pageInfo.endCursor : null;
        } while (after);
        return ids;
    };

    return {

        shop: {
            async get() {
                const data = await run(GET_SHOP);
                let primaryLocation = null;
                try {
                    primaryLocation = (await run(GET_PRIMARY_LOCATION)).location;
                } catch (err) {
                    // Without read_locations the shop is still valid; primary_location_id stays null.
                }
                return toRestShop(data.shop, primaryLocation);
            }
        },

        location: {
            list: listLocations
        },

        inventoryLevel: {
            /**
             * REST requires location_ids or inventory_item_ids. Several locations
             * are read one after another; the cursor is "<location index>:<cursor>".
             * @param {object} params location_ids, inventory_item_ids, updated_at_min, limit, after
             * @returns {Promise<Array>}
             */
            async list(params = {}) {

                const itemIds = idList(params.inventory_item_ids);
                let locationIds = idList(params.location_ids).map(id => toGid('Location', id));
                if (!locationIds.length && !itemIds.length) {
                    throw new client.ShopifyError('location_ids or inventory_item_ids is required.', 422);
                }
                if (!locationIds.length) {
                    locationIds = await allLocationIds();
                }

                const terms = [];
                if (itemIds.length) terms.push('(' + itemIds.map(id => `inventory_item_id:${quote(id)}`).join(' OR ') + ')');
                if (params.updated_at_min) terms.push(`updated_at:>=${quote(params.updated_at_min)}`);
                const query = joinQuery(terms);

                const first = client.pageSize(params.limit);
                const [startIndex, startCursor] = String(params.after || '0:').split(/:(.*)/s);
                const levels = [];
                let next = null;

                let after = startCursor || null;
                for (let index = Number(startIndex) || 0; index < locationIds.length; index++) {
                    if (levels.length >= first) {
                        next = `${index}:`;
                        break;
                    }
                    const data = await run(LIST_INVENTORY_LEVELS, {
                        id: locationIds[index], first: first - levels.length, after, query
                    });
                    after = null;
                    if (!data.location) {
                        throw new client.ShopifyError(`Location ${fromGid(locationIds[index])} not found.`, 404);
                    }
                    const connection = data.location.inventoryLevels;
                    levels.push(...nodesOf(connection).map(node => toRestInventoryLevel(node, data.location.id)));
                    if (connection.pageInfo.hasNextPage) {
                        next = `${index}:${connection.pageInfo.endCursor}`;
                        break;
                    }
                }

                return client.toListResult(levels, next ? { hasNextPage: true, endCursor: next } : null, params);
            }
        },

        checkout: {
            /**
             * Abandoned checkouts, newest first unless `order` says otherwise.
             * @param {object} params limit, after, since_id, created_at_*, updated_at_*, status, order
             * @returns {Promise<Array>}
             */
            list(params = {}) {
                const sort = sortFrom(params.order, CHECKOUT_SORT_KEYS, 'CREATED_AT');
                const sinceId = params.since_id ? Number(fromGid(params.since_id)) : null;
                const ids = idList(params.ids).map(Number);
                const filter = sinceId || ids.length
                    ? checkout => (!sinceId || checkout.id > sinceId) && (!ids.length || ids.includes(checkout.id))
                    : null;
                const variables = { query: checkoutQuery(params), ...sort };
                return listPage(LIST_CHECKOUTS, 'abandonedCheckouts', params, variables, toRestCheckout, filter);
            }
        },

        draftOrder: {
            /**
             * Draft orders, newest first unless `order` says otherwise.
             * @param {object} params limit, after, since_id, ids, status, updated_at_*, order
             * @returns {Promise<Array>}
             */
            list(params = {}) {
                const variables = { query: draftOrderQuery(params), ...sortFrom(params.order, DRAFT_ORDER_SORT_KEYS, 'ID') };
                return listPage(LIST_DRAFT_ORDERS, 'draftOrders', params, variables, toRestDraftOrder);
            }
        },

        webhook: {
            /**
             * @param {object} params address, topic, limit, after
             * @returns {Promise<Array>}
             */
            list(params = {}) {
                return listPage(LIST_WEBHOOKS, 'webhookSubscriptions', params, {
                    uri: params.address || null,
                    topics: params.topic ? [toTopicEnum(params.topic)] : null
                }, toRestWebhook);
            },

            /**
             * @param {object} payload { address, topic, format?, fields?, metafield_namespaces? }
             * @returns {Promise<object>}
             */
            async create(payload = {}) {
                const webhookSubscription = {
                    uri: payload.address,
                    format: payload.format ? String(payload.format).toUpperCase() : 'JSON'
                };
                if (Array.isArray(payload.fields) && payload.fields.length) {
                    webhookSubscription.includeFields = payload.fields;
                }
                if (Array.isArray(payload.metafield_namespaces) && payload.metafield_namespaces.length) {
                    webhookSubscription.metafieldNamespaces = payload.metafield_namespaces;
                }
                const data = await run(CREATE_WEBHOOK, { topic: toTopicEnum(payload.topic), webhookSubscription });
                const result = client.checkUserErrors(data.webhookSubscriptionCreate, 'webhookSubscriptionCreate');
                return toRestWebhook(result.webhookSubscription);
            },

            /**
             * @param {number|string} id REST id or WebhookSubscription gid
             * @returns {Promise<object>}
             */
            async delete(id) {
                const data = await run(DELETE_WEBHOOK, { id: toGid('WebhookSubscription', id) });
                const payload = data.webhookSubscriptionDelete;
                const missing = payload && (payload.userErrors || [])
                    .some(error => /does not exist/i.test(error.message));
                const result = missing ? {} : client.checkUserErrors(payload, 'webhookSubscriptionDelete');
                if (!result.deletedWebhookSubscriptionId) {
                    throw new client.ShopifyError(`Webhook ${id} not found.`, 404);
                }
                return {};
            }
        },

        /**
         * Newest returns of an order, in the REST webhook shape.
         * @param {number|string} orderId REST id or Order gid
         * @param {number} [limit]
         * @returns {Promise<Array>}
         */
        async returnsForOrder(orderId, limit = 1) {

            const data = await run(ORDER_RETURNS, { id: toGid('Order', orderId), first: client.pageSize(limit) });
            if (!data.order) {
                throw new client.ShopifyError(`Order ${fromGid(orderId)} not found.`, 404);
            }
            return nodesOf(data.order.returns).map(toRestReturn);
        }
    };
};

module.exports.toRestShop = toRestShop;
module.exports.toRestLocation = toRestLocation;
module.exports.toRestInventoryLevel = toRestInventoryLevel;
module.exports.toRestCheckout = toRestCheckout;
module.exports.toRestDraftOrder = toRestDraftOrder;
module.exports.toRestWebhook = toRestWebhook;
module.exports.toRestReturn = toRestReturn;
module.exports.toTopicEnum = toTopicEnum;
module.exports.fromTopicEnum = fromTopicEnum;
module.exports.checkoutToken = checkoutToken;
