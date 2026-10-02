'use strict';

const assert = require('assert');
const gqlStore = require('../../gql-store');

// GraphQL responses recorded live on the QA store (API 2026-10), trimmed.

const MONEY = amount => ({
    shopMoney: { amount, currencyCode: 'USD' },
    presentmentMoney: { amount, currencyCode: 'USD' }
});

const SHOP = {
    id: 'gid://shopify/Shop/107961745489',
    name: 'AppmixerQA',
    email: 'auth@appmixer.ai',
    contactEmail: 'auth@appmixer.ai',
    myshopifyDomain: 'appmixerqa-hapres7r.myshopify.com',
    shopOwnerName: 'David Durman',
    currencyCode: 'USD',
    ianaTimezone: 'America/New_York',
    timezoneOffset: '-0400',
    createdAt: '2026-10-02T10:35:39Z',
    updatedAt: '2026-10-02T11:25:05Z',
    weightUnit: 'POUNDS',
    taxesIncluded: false,
    taxShipping: false,
    checkoutApiSupported: true,
    setupRequired: false,
    enabledPresentmentCurrencies: ['USD'],
    transactionalSmsDisabled: false,
    marketingSmsConsentEnabledAtCheckout: false,
    primaryDomain: { host: 'appmixerqa-hapres7r.myshopify.com' },
    plan: { publicDisplayName: 'Basic', shopifyPlus: false },
    currencyFormats: {
        moneyFormat: '${{amount}}',
        moneyWithCurrencyFormat: '${{amount}} USD',
        moneyInEmailsFormat: '${{amount}}',
        moneyWithCurrencyInEmailsFormat: '${{amount}} USD'
    },
    shopAddress: {
        address1: null, address2: null, city: null, province: null, provinceCode: null,
        country: 'United States', countryCodeV2: 'US', zip: null, phone: null, latitude: null, longitude: null
    }
};

const LOCATION = {
    id: 'gid://shopify/Location/124679913553',
    name: 'My Custom Location',
    isActive: true,
    isFulfillmentService: false,
    createdAt: '2026-10-02T10:36:03Z',
    updatedAt: '2026-10-02T10:36:04Z',
    address: {
        address1: '123 Main St', address2: null, city: 'Toronto', zip: 'A1A 1A1', province: 'Ontario',
        provinceCode: 'ON', country: 'Canada', countryCode: 'CA', phone: '555-5555'
    }
};

const INVENTORY_LEVEL = {
    id: 'gid://shopify/InventoryLevel/164439425105?inventory_item_id=64806875660369',
    updatedAt: '2026-10-02T10:36:05Z',
    item: { id: 'gid://shopify/InventoryItem/64806875660369' },
    quantities: [{ name: 'available', quantity: 50 }]
};

const CUSTOMER = {
    id: 'gid://shopify/Customer/27598980087889',
    firstName: null,
    lastName: null,
    note: null,
    tags: [],
    state: 'DISABLED',
    taxExempt: false,
    verifiedEmail: true,
    createdAt: '2026-10-02T13:27:33Z',
    updatedAt: '2026-10-02T13:27:33Z',
    numberOfOrders: '0',
    locale: 'en-US',
    amountSpent: { amount: '0.0', currencyCode: 'USD' },
    defaultEmailAddress: { emailAddress: 'vladimir.talas@appmixer.ai', marketingState: 'NOT_SUBSCRIBED' },
    defaultPhoneNumber: null,
    defaultAddress: null
};

const CHECKOUT = {
    id: 'gid://shopify/AbandonedCheckout/72420962140241',
    name: '#72420962140241',
    abandonedCheckoutUrl: 'https://appmixerqa-hapres7r.myshopify.com/107961745489/checkouts/ac/hWNHVSMfAwqum6xvRm7dyFu7/recover?key=938cca59d2e3eb603f988e4b8729d706&locale=en-US',
    createdAt: '2026-10-02T13:27:33Z',
    updatedAt: '2026-10-02T13:27:33Z',
    completedAt: null,
    note: '',
    taxesIncluded: false,
    discountCodes: [],
    customAttributes: [],
    subtotalPriceSet: MONEY('693.45'),
    totalPriceSet: MONEY('693.45'),
    totalTaxSet: MONEY('0.0'),
    totalDiscountSet: MONEY('0.0'),
    totalLineItemsPriceSet: MONEY('693.45'),
    taxLines: [],
    customer: CUSTOMER,
    shippingAddress: null,
    billingAddress: null,
    lineItems: {
        nodes: [{
            id: 'gid://shopify/AbandonedCheckoutLineItem/ee015e1efa018c1b9c0c05e330f8fc65?checkout=47661deb0143428e4de409b48e960643&index=0&actoken',
            title: 'The Multi-location Snowboard',
            variantTitle: null,
            quantity: 1,
            sku: null,
            originalUnitPriceSet: MONEY('693.45'),
            originalTotalPriceSet: MONEY('693.45'),
            customAttributes: [],
            product: { id: 'gid://shopify/Product/16344831754321', vendor: 'AppmixerQA' },
            variant: { id: 'gid://shopify/ProductVariant/62788974084177', title: 'Default Title' }
        }]
    }
};

const DRAFT_ORDER = {
    id: 'gid://shopify/DraftOrder/1698531606609',
    name: '#D1',
    note2: null,
    email: 'Russel.winfield@example.com',
    phone: null,
    taxesIncluded: false,
    taxExempt: false,
    currencyCode: 'USD',
    presentmentCurrencyCode: 'USD',
    invoiceSentAt: null,
    invoiceUrl: 'https://appmixerqa-hapres7r.myshopify.com/107961745489/invoices/cfae1d590aab8c6b991c56e9dbd667a1',
    createdAt: '2026-10-02T10:36:04Z',
    updatedAt: '2026-10-02T10:36:04Z',
    completedAt: null,
    status: 'OPEN',
    tags: ['Custom Item'],
    order: null,
    customAttributes: [],
    appliedDiscount: null,
    shippingLine: { title: 'International Shipping', shippingRateHandle: 'eyJhbGciOiJIUzI1NiJ9.x', custom: false, originalPriceSet: MONEY('30.0') },
    taxLines: [],
    subtotalPriceSet: MONEY('200.0'),
    totalPriceSet: MONEY('230.0'),
    totalTaxSet: MONEY('0.0'),
    customer: null,
    shippingAddress: {
        id: 'gid://shopify/MailingAddress/42115992223825?model_name=Address', firstName: null, lastName: null, name: '',
        company: null, address1: '105 Victoria St', address2: null, city: 'Toronto', province: null, country: 'Canada',
        zip: 'M5C1N7', phone: '+14165550135', provinceCode: null, countryCodeV2: 'CA', latitude: 43.652143, longitude: -79.3775825
    },
    billingAddress: null,
    lineItems: {
        nodes: [{
            id: 'gid://shopify/DraftOrderLineItem/59738148307025',
            name: 'Custom Snowboard',
            title: 'Custom Snowboard',
            variantTitle: null,
            sku: null,
            vendor: null,
            quantity: 1,
            custom: true,
            requiresShipping: true,
            taxable: true,
            isGiftCard: false,
            weight: { unit: 'KILOGRAMS', value: 0.5 },
            originalUnitPriceSet: MONEY('200.0'),
            customAttributes: [{ key: 'wrap description', value: 'Put my cat on it' }],
            appliedDiscount: null,
            taxLines: [],
            product: null,
            variant: null
        }]
    }
};

const WEBHOOK = {
    id: 'gid://shopify/WebhookSubscription/2408471724113',
    uri: 'https://example.com/gql-probe-store-2',
    topic: 'DRAFT_ORDERS_CREATE',
    format: 'JSON',
    createdAt: '2026-10-02T14:41:03Z',
    updatedAt: '2026-10-02T14:41:03Z',
    includeFields: [],
    metafieldNamespaces: [],
    apiVersion: { handle: '2026-10' }
};

// Synthetic (no return could be created on the QA store), shaped by the 2026-10 schema.
const RETURN = {
    id: 'gid://shopify/Return/945000954',
    name: '#1001-R1',
    status: 'OPEN',
    totalQuantity: 1,
    createdAt: '2026-10-02T12:00:00Z',
    closedAt: null,
    requestApprovedAt: '2026-10-02T12:05:00Z',
    order: { id: 'gid://shopify/Order/450789469', name: '#1001' },
    decline: null,
    returnLineItems: {
        nodes: [{
            id: 'gid://shopify/ReturnLineItem/111',
            quantity: 1,
            customerNote: null,
            returnReasonNote: 'too small',
            returnReasonDefinition: { handle: 'size-too-small', name: 'Size too small' },
            fulfillmentLineItem: { id: 'gid://shopify/FulfillmentLineItem/466157049', lineItem: { id: 'gid://shopify/LineItem/669751112' } }
        }]
    },
    reverseFulfillmentOrders: { nodes: [{ id: 'gid://shopify/ReverseFulfillmentOrder/222', status: 'OPEN' }] }
};

const page = (nodes, hasNextPage = false, endCursor = null) => ({ nodes, pageInfo: { hasNextPage, endCursor } });

// run() mock answering in order and recording every call.
function mockRun(...responses) {

    const calls = [];
    const run = async (query, variables) => {
        calls.push({ query, variables });
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return typeof response === 'function' ? response(query, variables) : response;
    };
    return { run, calls };
}

describe('gql-store', () => {

    describe('shop.get', () => {

        it('maps the shop to the REST shape, primary location from a second query', async () => {

            const { run, calls } = mockRun({ shop: SHOP }, { location: { id: 'gid://shopify/Location/124679880785' } });
            const shop = await gqlStore(run).shop.get();

            assert.strictEqual(calls.length, 2);
            assert.strictEqual(shop.id, 107961745489);
            assert.strictEqual(shop.name, 'AppmixerQA');
            assert.strictEqual(shop.domain, 'appmixerqa-hapres7r.myshopify.com');
            assert.strictEqual(shop.myshopify_domain, 'appmixerqa-hapres7r.myshopify.com');
            assert.strictEqual(shop.shop_owner, 'David Durman');
            assert.strictEqual(shop.country, 'US');
            assert.strictEqual(shop.country_name, 'United States');
            assert.strictEqual(shop.currency, 'USD');
            assert.strictEqual(shop.iana_timezone, 'America/New_York');
            assert.strictEqual(shop.timezone, '(GMT-04:00) America/New_York');
            assert.strictEqual(shop.plan_name, 'basic');
            assert.strictEqual(shop.plan_display_name, 'Basic');
            assert.strictEqual(shop.weight_unit, 'lb');
            assert.strictEqual(shop.money_format, '${{amount}}');
            assert.strictEqual(shop.primary_location_id, 124679880785);
            assert.strictEqual(shop.taxes_included, false);
        });

        it('still answers when the primary location is not readable', async () => {

            const denied = Object.assign(new Error('Access denied'), { statusCode: 403 });
            const { run } = mockRun({ shop: SHOP }, denied);
            const shop = await gqlStore(run).shop.get();
            assert.strictEqual(shop.name, 'AppmixerQA');
            assert.strictEqual(shop.primary_location_id, null);
        });

        it('propagates errors of the shop query (token validation)', async () => {

            const unauthorized = Object.assign(new Error('Invalid API key or access token'), { statusCode: 401 });
            const { run } = mockRun(unauthorized);
            await assert.rejects(gqlStore(run).shop.get(), err => err.statusCode === 401);
        });

        it('derives shopify_plus plan name', () => {

            const shop = gqlStore.toRestShop({ ...SHOP, plan: { publicDisplayName: 'Shopify Plus', shopifyPlus: true } });
            assert.strictEqual(shop.plan_name, 'shopify_plus');
        });
    });

    describe('location.list', () => {

        it('maps locations and passes pagination', async () => {

            const { run, calls } = mockRun({ locations: page([LOCATION, { ...LOCATION, isFulfillmentService: true }], true, 'C1') });
            const locations = await gqlStore(run).location.list({ limit: 2 });

            assert.deepStrictEqual(calls[0].variables, { first: 2, after: null });
            assert.deepStrictEqual(locations[0], {
                id: 124679913553,
                name: 'My Custom Location',
                address1: '123 Main St',
                address2: null,
                city: 'Toronto',
                zip: 'A1A 1A1',
                province: 'Ontario',
                province_code: 'ON',
                country: 'CA',
                country_code: 'CA',
                country_name: 'Canada',
                phone: '555-5555',
                active: true,
                legacy: false,
                created_at: '2026-10-02T10:36:03Z',
                updated_at: '2026-10-02T10:36:04Z',
                admin_graphql_api_id: 'gid://shopify/Location/124679913553'
            });
            assert.strictEqual(locations[1].legacy, true);
            assert.deepStrictEqual(locations.nextPageParameters, { limit: 2, after: 'C1' });
        });
    });

    describe('inventoryLevel.list', () => {

        it('lists levels of one location as REST inventory levels', async () => {

            const { run, calls } = mockRun({
                location: { id: LOCATION.id, inventoryLevels: page([INVENTORY_LEVEL], true, 'C1') }
            });
            const levels = await gqlStore(run).inventoryLevel.list({ location_ids: '124679913553', limit: 1 });

            assert.deepStrictEqual(calls[0].variables, { id: 'gid://shopify/Location/124679913553', first: 1, after: null, query: null });
            assert.deepStrictEqual(levels, [{
                inventory_item_id: 64806875660369,
                location_id: 124679913553,
                available: 50,
                updated_at: '2026-10-02T10:36:05Z',
                admin_graphql_api_id: 'gid://shopify/InventoryLevel/164439425105?inventory_item_id=64806875660369'
            }]);
            assert.deepStrictEqual(levels.nextPageParameters, { location_ids: '124679913553', limit: 1, after: '0:C1' });
        });

        it('continues into the next location and resumes from a composite cursor', async () => {

            const { run, calls } = mockRun(
                { location: { id: LOCATION.id, inventoryLevels: page([INVENTORY_LEVEL]) } },
                { location: { id: 'gid://shopify/Location/2', inventoryLevels: page([INVENTORY_LEVEL], true, 'C2') } }
            );
            const levels = await gqlStore(run).inventoryLevel.list({ location_ids: '124679913553,2', limit: 3, inventory_item_ids: '5,6' });

            assert.strictEqual(levels.length, 2);
            assert.strictEqual(levels[1].location_id, 2);
            assert.strictEqual(calls[0].variables.query, "(inventory_item_id:'5' OR inventory_item_id:'6')");
            assert.strictEqual(calls[1].variables.first, 2);
            assert.strictEqual(levels.nextPageParameters.after, '1:C2');

            const resumed = mockRun({ location: { id: 'gid://shopify/Location/2', inventoryLevels: page([]) } });
            await gqlStore(resumed.run).inventoryLevel.list({ location_ids: '124679913553,2', limit: 3, after: '1:C2' });
            assert.deepStrictEqual(resumed.calls[0].variables, { id: 'gid://shopify/Location/2', first: 3, after: 'C2', query: null });
        });

        it('requires location_ids or inventory_item_ids, 404 for an unknown location', async () => {

            const noFilter = gqlStore(mockRun().run).inventoryLevel.list({ limit: 1 });
            await assert.rejects(noFilter, err => err.statusCode === 422);
            await assert.rejects(gqlStore(mockRun({ location: null }).run).inventoryLevel.list({ location_ids: '1' }), err => err.statusCode === 404);
        });
    });

    describe('checkout.list', () => {

        it('maps abandoned checkouts with the REST id and checkout token', async () => {

            const { run, calls } = mockRun({ abandonedCheckouts: page([CHECKOUT]) });
            const [checkout] = await gqlStore(run).checkout.list({ limit: 250 });

            assert.deepStrictEqual(calls[0].variables, { first: 250, after: null, query: null, sortKey: 'CREATED_AT', reverse: true });
            assert.strictEqual(checkout.id, 72420962140241);
            assert.strictEqual(checkout.token, '47661deb0143428e4de409b48e960643');
            assert.strictEqual(checkout.cart_token, 'hWNHVSMfAwqum6xvRm7dyFu7');
            assert.strictEqual(checkout.email, 'vladimir.talas@appmixer.ai');
            assert.strictEqual(checkout.customer_locale, 'en-US');
            assert.strictEqual(checkout.currency, 'USD');
            assert.strictEqual(checkout.buyer_accepts_marketing, false);
            assert.strictEqual(checkout.note, null);
            assert.strictEqual(checkout.total_price, '693.45');
            assert.strictEqual(checkout.total_tax, '0.00');
            assert.strictEqual(checkout.gateway, null);
            assert.strictEqual(checkout.landing_site, null);
            assert.strictEqual(checkout.customer.id, 27598980087889);
            assert.strictEqual(checkout.customer.state, 'disabled');
            assert.deepStrictEqual(checkout.line_items[0], {
                product_id: 16344831754321,
                variant_id: 62788974084177,
                title: 'The Multi-location Snowboard',
                variant_title: null,
                sku: null,
                vendor: 'AppmixerQA',
                quantity: 1,
                price: '693.45',
                line_price: '693.45',
                properties: []
            });
            assert.strictEqual(checkout.shipping_address, null);
        });

        it('translates filters and applies since_id to the page', async () => {

            const { run, calls } = mockRun({ abandonedCheckouts: page([CHECKOUT]) });
            const result = await gqlStore(run).checkout.list({
                limit: 5, since_id: 72420962140241, status: 'open', created_at_min: '2026-10-01T00:00:00Z', order: 'id asc'
            });

            assert.strictEqual(calls[0].variables.query, "created_at:>='2026-10-01T00:00:00Z' AND status:'open'");
            assert.strictEqual(calls[0].variables.sortKey, 'ID');
            assert.strictEqual(calls[0].variables.reverse, false);
            assert.strictEqual(result.length, 0);
        });

        it('reads the token from a legacy recovery URL when there are no line items', () => {

            const token = gqlStore.checkoutToken({
                lineItems: { nodes: [] },
                abandonedCheckoutUrl: 'https://shop.myshopify.com/1/checkouts/abc123/recover?key=k'
            });
            assert.strictEqual(token, 'abc123');
            const withoutItems = { lineItems: { nodes: [] }, abandonedCheckoutUrl: CHECKOUT.abandonedCheckoutUrl };
            assert.strictEqual(gqlStore.checkoutToken(withoutItems), null);
        });
    });

    describe('draftOrder.list', () => {

        it('maps draft orders to the REST shape', async () => {

            const { run, calls } = mockRun({ draftOrders: page([DRAFT_ORDER], true, 'C1') });
            const result = await gqlStore(run).draftOrder.list({ limit: 1 });
            const [draft] = result;

            assert.deepStrictEqual(calls[0].variables, { first: 1, after: null, query: null, sortKey: 'ID', reverse: true });
            assert.strictEqual(draft.id, 1698531606609);
            assert.strictEqual(draft.name, '#D1');
            assert.strictEqual(draft.status, 'open');
            assert.strictEqual(draft.note, null);
            assert.strictEqual(draft.tags, 'Custom Item');
            assert.strictEqual(draft.currency, 'USD');
            assert.strictEqual(draft.subtotal_price, '200.00');
            assert.strictEqual(draft.total_price, '230.00');
            assert.strictEqual(draft.total_tax, '0.00');
            assert.deepStrictEqual(draft.shipping_line, { title: 'International Shipping', custom: false, handle: 'eyJhbGciOiJIUzI1NiJ9.x', price: '30.00' });
            assert.strictEqual(draft.shipping_address.country_code, 'CA');
            assert.strictEqual(draft.shipping_address.address1, '105 Victoria St');
            assert.strictEqual(draft.line_items[0].id, 59738148307025);
            assert.strictEqual(draft.line_items[0].grams, 500);
            assert.strictEqual(draft.line_items[0].price, '200.00');
            assert.deepStrictEqual(draft.line_items[0].properties, [{ name: 'wrap description', value: 'Put my cat on it' }]);
            assert.strictEqual(draft.admin_graphql_api_id, 'gid://shopify/DraftOrder/1698531606609');
            assert.deepStrictEqual(result.nextPageParameters, { limit: 1, after: 'C1' });
        });

        it('translates status, since_id, ids, dates and order', async () => {

            const { run, calls } = mockRun({ draftOrders: page([]) });
            await gqlStore(run).draftOrder.list({
                status: 'open', since_id: 1698531606609, ids: '1,gid://shopify/DraftOrder/2',
                updated_at_min: '2026-10-01T00:00:00Z', order: 'updated_at desc', after: 'C1'
            });
            assert.deepStrictEqual(calls[0].variables, {
                first: 50,
                after: 'C1',
                query: "id:>'1698531606609' AND (id:'1' OR id:'2') AND updated_at:>='2026-10-01T00:00:00Z' AND status:'open'",
                sortKey: 'UPDATED_AT',
                reverse: true
            });
        });
    });

    describe('webhook', () => {

        it('lists subscriptions of an address in the REST shape', async () => {

            const { run, calls } = mockRun({ webhookSubscriptions: page([WEBHOOK]) });
            const webhooks = await gqlStore(run).webhook.list({ address: WEBHOOK.uri });

            assert.strictEqual(calls[0].variables.uri, WEBHOOK.uri);
            assert.strictEqual(calls[0].variables.topics, null);
            assert.deepStrictEqual(webhooks[0], {
                id: 2408471724113,
                address: 'https://example.com/gql-probe-store-2',
                topic: 'draft_orders/create',
                format: 'json',
                fields: [],
                metafield_namespaces: [],
                api_version: '2026-10',
                created_at: '2026-10-02T14:41:03Z',
                updated_at: '2026-10-02T14:41:03Z',
                admin_graphql_api_id: 'gid://shopify/WebhookSubscription/2408471724113'
            });
        });

        it('creates a subscription from a REST topic', async () => {

            const created = { webhookSubscriptionCreate: { webhookSubscription: WEBHOOK, userErrors: [] } };
            const { run, calls } = mockRun(created);
            const webhook = await gqlStore(run).webhook.create({ address: WEBHOOK.uri, topic: 'draft_orders/create' });

            assert.deepStrictEqual(calls[0].variables, {
                topic: 'DRAFT_ORDERS_CREATE',
                webhookSubscription: { uri: WEBHOOK.uri, format: 'JSON' }
            });
            assert.strictEqual(webhook.id, 2408471724113);
            assert.strictEqual(webhook.topic, 'draft_orders/create');
        });

        it('turns userErrors into 422', async () => {

            const { run } = mockRun({ webhookSubscriptionCreate: {
                webhookSubscription: null,
                userErrors: [{ field: ['webhookSubscription', 'callbackUrl'], message: 'Address for this topic has already been taken' }]
            } });
            await assert.rejects(gqlStore(run).webhook.create({ address: WEBHOOK.uri, topic: 'orders/create' }),
                err => err.statusCode === 422 && /already been taken/.test(err.message));
        });

        it('deletes by REST id or gid; a missing subscription is 404', async () => {

            const deleted = { webhookSubscriptionDelete: { deletedWebhookSubscriptionId: WEBHOOK.id, userErrors: [] } };
            const { run, calls } = mockRun(deleted, deleted);
            const api = gqlStore(run);

            assert.deepStrictEqual(await api.webhook.delete(2408471724113), {});
            assert.deepStrictEqual(await api.webhook.delete(WEBHOOK.id), {});
            assert.strictEqual(calls[0].variables.id, WEBHOOK.id);
            assert.strictEqual(calls[1].variables.id, WEBHOOK.id);

            const missing = mockRun({ webhookSubscriptionDelete: {
                deletedWebhookSubscriptionId: null,
                userErrors: [{ field: ['id'], message: 'Webhook subscription does not exist' }]
            } });
            await assert.rejects(gqlStore(missing.run).webhook.delete(1), err => err.statusCode === 404);
        });

        it('converts topics both ways', () => {

            assert.strictEqual(gqlStore.toTopicEnum('orders/create'), 'ORDERS_CREATE');
            assert.strictEqual(gqlStore.toTopicEnum('inventory_levels/update'), 'INVENTORY_LEVELS_UPDATE');
            assert.strictEqual(gqlStore.fromTopicEnum('ORDERS_CREATE'), 'orders/create');
            assert.strictEqual(gqlStore.fromTopicEnum('ORDERS_PARTIALLY_FULFILLED'), 'orders/partially_fulfilled');
            assert.strictEqual(gqlStore.fromTopicEnum('INVENTORY_LEVELS_UPDATE'), 'inventory_levels/update');
            assert.strictEqual(gqlStore.fromTopicEnum('DRAFT_ORDERS_CREATE'), 'draft_orders/create');
            assert.strictEqual(gqlStore.fromTopicEnum('RETURNS_REQUEST'), 'returns/request');
            assert.strictEqual(gqlStore.fromTopicEnum('APP_UNINSTALLED'), 'app/uninstalled');
        });
    });

    describe('returns', () => {

        it('maps a Return to the REST webhook shape', () => {

            assert.deepStrictEqual(gqlStore.toRestReturn(RETURN), {
                id: 945000954,
                order_id: 450789469,
                status: 'open',
                name: '#1001-R1',
                total_quantity: 1,
                created_at: '2026-10-02T12:00:00Z',
                closed_at: null,
                request_approved_at: '2026-10-02T12:05:00Z',
                decline: null,
                return_line_items: [{
                    id: 111,
                    quantity: 1,
                    return_reason: 'size-too-small',
                    return_reason_name: 'Size too small',
                    return_reason_note: 'too small',
                    customer_note: null,
                    fulfillment_line_item_id: 466157049,
                    line_item_id: 669751112,
                    admin_graphql_api_id: 'gid://shopify/ReturnLineItem/111'
                }],
                reverse_fulfillment_orders: [{ id: 222, status: 'open', admin_graphql_api_id: 'gid://shopify/ReverseFulfillmentOrder/222' }],
                order: { id: 450789469, name: '#1001', admin_graphql_api_id: 'gid://shopify/Order/450789469' },
                admin_graphql_api_id: 'gid://shopify/Return/945000954'
            });
        });

        it('returnsForOrder queries the order by gid, newest first', async () => {

            const { run, calls } = mockRun({ order: { id: 'gid://shopify/Order/450789469', returns: { nodes: [RETURN] } } });
            const returns = await gqlStore(run).returnsForOrder(450789469, 1);

            assert.deepStrictEqual(calls[0].variables, { id: 'gid://shopify/Order/450789469', first: 1 });
            assert.ok(/returns\(first: \$first, reverse: true\)/.test(calls[0].query));
            assert.strictEqual(returns.length, 1);
            assert.strictEqual(returns[0].id, 945000954);

            const noOrder = gqlStore(mockRun({ order: null }).run).returnsForOrder(1);
            await assert.rejects(noOrder, err => err.statusCode === 404);
        });
    });
});
