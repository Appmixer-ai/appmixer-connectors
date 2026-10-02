'use strict';

const assert = require('assert');
const gqlOrders = require('../../gql-orders');

const usd = amount => ({ shopMoney: { amount, currencyCode: 'USD' }, presentmentMoney: { amount, currencyCode: 'USD' } });

// Recorded live on the QA store (2026-10 API): order #1011 created through
// order.create() with a variant line, a custom line, a discount code, a tax
// line and both addresses. Presentment money re-added, URLs shortened.
function createdOrderNode() {

    return {
        id: 'gid://shopify/Order/17287570063441', name: '#1011', number: 1011,
        email: 'gql-probe.order@example.com', phone: '+420777123456', note: 'gql-probe order', tags: ['e2e', 'gql-probe'],
        currencyCode: 'USD', presentmentCurrencyCode: 'USD',
        createdAt: '2026-10-02T14:40:04Z', updatedAt: '2026-10-02T14:40:05Z', processedAt: '2026-10-02T14:40:04Z',
        cancelledAt: null, cancelReason: null, closedAt: null, confirmed: true, test: true,
        displayFinancialStatus: 'PENDING', displayFulfillmentStatus: 'UNFULFILLED',
        taxesIncluded: false, customerAcceptsMarketing: false, customerLocale: null,
        sourceName: '430772256769', sourceIdentifier: null,
        statusPageUrl: 'https://appmixerqa-hapres7r.myshopify.com/107961745489/orders/4e27/authenticate?key=337e',
        paymentGatewayNames: [], discountCodes: ['GQLPROBE5'], totalWeight: '300',
        clientIp: null, cartToken: null, checkoutToken: null,
        app: { id: 'gid://shopify/App/430772256769' }, retailLocation: null,
        subtotalPriceSet: usd('1779.4'), totalPriceSet: usd('1781.5'), totalTaxSet: usd('2.1'),
        totalDiscountsSet: usd('5.0'), totalShippingPriceSet: usd('0.0'), totalTipReceivedSet: usd('0.0'),
        customAttributes: [],
        customer: {
            id: 'gid://shopify/Customer/27599109947473', firstName: 'Gql', lastName: 'Probe', state: 'DISABLED',
            note: null, tags: [], taxExempt: false, verifiedEmail: true,
            createdAt: '2026-10-02T14:40:04Z', updatedAt: '2026-10-02T14:40:04Z',
            defaultEmailAddress: { emailAddress: 'gql-probe.order@example.com' }, defaultPhoneNumber: null
        },
        billingAddress: {
            id: 'gid://shopify/MailingAddress/42116621041745?model_name=Address', firstName: 'Gql', lastName: 'Probe',
            name: 'Gql Probe', company: null, address1: 'Main 1', address2: null, city: 'Prague', province: null,
            country: 'Czech Republic', zip: '110 00', phone: '+420777123456', provinceCode: null, countryCodeV2: 'CZ',
            latitude: 50.0860381, longitude: 14.4222689
        },
        shippingAddress: {
            id: 'gid://shopify/MailingAddress/42116621008977?model_name=Address', firstName: 'Gql', lastName: 'Probe',
            name: 'Gql Probe', company: null, address1: 'Main 2', address2: null, city: 'Toronto', province: 'Ontario',
            country: 'Canada', zip: 'M5V 2T6', phone: null, provinceCode: 'ON', countryCodeV2: 'CA',
            latitude: 43.6790905, longitude: -79.2983302
        },
        taxLines: [{ title: 'gql-probe VAT', rate: 0.21, channelLiable: null, priceSet: usd('2.1') }],
        shippingLines: { nodes: [] },
        discountApplications: { nodes: [{
            kind: 'ManualDiscountApplication', allocationMethod: 'ACROSS', targetSelection: 'ALL', targetType: 'LINE_ITEM',
            value: { kind: 'MoneyV2', amount: '5.0', currencyCode: 'USD' }, title: 'GQLPROBE5', description: 'GQLPROBE5'
        }] },
        lineItems: {
            nodes: [{
                id: 'gid://shopify/LineItem/46364277571665', name: 'The Out of Stock Snowboard', title: 'The Out of Stock Snowboard',
                variantTitle: null, quantity: 2, currentQuantity: 2, unfulfilledQuantity: 2, sku: null, vendor: 'AppmixerQA',
                taxable: true, requiresShipping: false, isGiftCard: false,
                variant: { id: 'gid://shopify/ProductVariant/62788973264977' }, product: { id: 'gid://shopify/Product/16344831623249' },
                weight: { unit: 'POUNDS', value: 0 },
                originalUnitPriceSet: usd('885.95'), totalDiscountSet: usd('0.0'), customAttributes: [],
                taxLines: [{ title: 'gql-probe VAT', rate: 0.21, channelLiable: false, priceSet: usd('2.09') }]
            }, {
                id: 'gid://shopify/LineItem/46364277604433', name: 'gql-probe custom item', title: 'gql-probe custom item',
                variantTitle: null, quantity: 1, currentQuantity: 1, unfulfilledQuantity: 1, sku: null, vendor: null,
                taxable: true, requiresShipping: true, isGiftCard: false, variant: null, product: null,
                weight: { unit: 'POUNDS', value: 0.66 },
                originalUnitPriceSet: usd('12.5'), totalDiscountSet: usd('0.0'), customAttributes: [],
                taxLines: [{ title: 'gql-probe VAT', rate: 0.21, channelLiable: false, priceSet: usd('0.01') }]
            }],
            pageInfo: { hasNextPage: false, endCursor: 'eyJsYXN0X2lkIjo0NjM2NDI3NzYwNDQzM30=' }
        },
        fulfillments: [],
        refunds: []
    };
}

// Recorded live: order #1008 (one refunded line item), via OrderRefunds.
function refundOrderNode() {

    return {
        id: 'gid://shopify/Order/17287385874513',
        refunds: [{
            id: 'gid://shopify/Refund/1221755568209', note: 'Appmixer E2E refund',
            createdAt: '2026-10-02T12:06:33Z', processedAt: '2026-10-02T12:06:33Z', return: null,
            refundLineItems: { nodes: [{
                id: 'gid://shopify/RefundLineItem/1202416353361', quantity: 1, restockType: 'NO_RESTOCK', restocked: false,
                location: null, subtotalSet: usd('9.99'), totalTaxSet: usd('0.0'),
                lineItem: { id: 'gid://shopify/LineItem/46363944058961' }
            }] },
            transactions: { nodes: [{
                id: 'gid://shopify/OrderTransaction/9000000000001', kind: 'REFUND', status: 'SUCCESS', gateway: 'manual',
                test: true, createdAt: '2026-10-02T12:06:33Z', processedAt: '2026-10-02T12:06:33Z', errorCode: null,
                paymentId: null, amountSet: usd('9.99'), parentTransaction: { id: 'gid://shopify/OrderTransaction/9000000000000' }
            }] },
            orderAdjustments: { nodes: [] }
        }],
        lineItems: { nodes: [{
            id: 'gid://shopify/LineItem/46363944058961', name: 'Appmixer E2E Trigger Item', title: 'Appmixer E2E Trigger Item',
            variantTitle: null, quantity: 1, currentQuantity: 0, unfulfilledQuantity: 1, sku: null, vendor: null,
            taxable: true, requiresShipping: true, isGiftCard: false, variant: null, product: null,
            weight: { unit: 'POUNDS', value: 0 }, originalUnitPriceSet: usd('9.99'), totalDiscountSet: usd('0.0'),
            customAttributes: [], taxLines: []
        }] }
    };
}

// Recorded live: order #1010 (fulfilled with tracking), via OrderFulfillments.
function fulfillmentOrderNode() {

    return {
        id: 'gid://shopify/Order/17287389675601',
        fulfillments: [{
            id: 'gid://shopify/Fulfillment/9264261333073', name: '#1010-F1', status: 'SUCCESS', displayStatus: 'FULFILLED',
            createdAt: '2026-10-02T12:09:04Z', updatedAt: '2026-10-02T12:10:06Z',
            location: { id: 'gid://shopify/Location/124679880785' }, service: { handle: 'manual' },
            trackingInfo: [{ company: 'Other', number: 'E2E-TRACK-1', url: null }],
            fulfillmentLineItems: { nodes: [{ id: 'gid://shopify/FulfillmentLineItem/21191209812049', quantity: 1, lineItem: { id: 'gid://shopify/LineItem/46363949891665' } }] }
        }],
        lineItems: { nodes: [{
            id: 'gid://shopify/LineItem/46363949891665', name: 'Appmixer E2E Trigger Item', title: 'Appmixer E2E Trigger Item',
            variantTitle: null, quantity: 1, currentQuantity: 1, unfulfilledQuantity: 0, sku: null, vendor: null,
            taxable: true, requiresShipping: true, isGiftCard: false, variant: null, product: null,
            weight: { unit: 'POUNDS', value: 0 }, originalUnitPriceSet: usd('9.99'), totalDiscountSet: usd('0.0'),
            customAttributes: [], taxLines: []
        }] }
    };
}

// `run` mock: records each call and answers by operation name.
function mockRun(answers) {

    const calls = [];
    const run = async (query, variables) => {
        const name = query.match(/(?:query|mutation) (\w+)/)[1];
        calls.push({ name, query, variables });
        const answer = answers[name];
        if (!answer) throw new Error(`Unexpected operation ${name}`);
        return typeof answer === 'function' ? answer(variables, calls) : answer;
    };
    return { run, calls };
}

describe('Shopify GraphQL orders', () => {

    describe('toRestOrder', () => {

        it('should map an order to the REST shape', () => {

            const order = gqlOrders.toRestOrder(createdOrderNode());

            assert.strictEqual(order.id, 17287570063441);
            assert.strictEqual(order.admin_graphql_api_id, 'gid://shopify/Order/17287570063441');
            assert.strictEqual(order.name, '#1011');
            assert.strictEqual(order.order_number, 1011);
            assert.strictEqual(order.number, 11);
            assert.strictEqual(order.email, 'gql-probe.order@example.com');
            assert.strictEqual(order.note, 'gql-probe order');
            assert.strictEqual(order.tags, 'e2e, gql-probe');
            assert.strictEqual(order.financial_status, 'pending');
            assert.strictEqual(order.fulfillment_status, null);
            assert.strictEqual(order.app_id, 430772256769);
            assert.strictEqual(order.subtotal_price, '1779.40');
            assert.strictEqual(order.total_price, '1781.50');
            assert.strictEqual(order.total_tax, '2.10');
            assert.strictEqual(order.total_discounts, '5.00');
            assert.deepStrictEqual(order.total_price_set, {
                shop_money: { amount: '1781.50', currency_code: 'USD' },
                presentment_money: { amount: '1781.50', currency_code: 'USD' }
            });
            // 2 × 885.95 + 12.50
            assert.strictEqual(order.total_line_items_price, '1784.40');
            assert.strictEqual(order.total_weight, 300);
            assert.strictEqual(order.customer.id, 27599109947473);
            assert.strictEqual(order.customer.email, 'gql-probe.order@example.com');
            assert.strictEqual(order.customer.state, 'disabled');
            assert.strictEqual(order.billing_address.country_code, 'CZ');
            assert.strictEqual(order.billing_address.id, 42116621041745);
            assert.strictEqual(order.shipping_address.province_code, 'ON');
            assert.deepStrictEqual(order.discount_codes, [{ code: 'GQLPROBE5', amount: '5.00', type: 'fixed_amount' }]);
            assert.strictEqual(order.discount_applications[0].type, 'manual');
            assert.strictEqual(order.discount_applications[0].target_type, 'line_item');
            assert.deepStrictEqual(order.tax_lines.map(tax => [tax.title, tax.rate, tax.price]), [['gql-probe VAT', 0.21, '2.10']]);
            assert.strictEqual(order.browser_ip, null);
            assert.strictEqual(order.token, null);
            assert.strictEqual(order.user_id, null);
            assert.deepStrictEqual(order.fulfillments, []);
            assert.deepStrictEqual(order.refunds, []);
        });

        it('should map line items', () => {

            const [variantLine, customLine] = gqlOrders.toRestOrder(createdOrderNode()).line_items;

            assert.strictEqual(variantLine.id, 46364277571665);
            assert.strictEqual(variantLine.variant_id, 62788973264977);
            assert.strictEqual(variantLine.product_id, 16344831623249);
            assert.strictEqual(variantLine.quantity, 2);
            assert.strictEqual(variantLine.price, '885.95');
            assert.strictEqual(variantLine.fulfillable_quantity, 2);
            assert.strictEqual(variantLine.fulfillment_status, null);
            assert.strictEqual(variantLine.tax_lines[0].price, '2.09');
            assert.strictEqual(customLine.variant_id, null);
            assert.strictEqual(customLine.product_exists, false);
            assert.strictEqual(customLine.price, '12.50');
            // 0.66 lb
            assert.strictEqual(customLine.grams, 299);
        });

        it('should map the REST fulfillment status and cancel reason', () => {

            const node = createdOrderNode();
            node.displayFulfillmentStatus = 'PARTIALLY_FULFILLED';
            node.cancelReason = 'CUSTOMER';
            node.cancelledAt = '2026-10-02T15:00:00Z';
            node.lineItems.nodes[0].unfulfilledQuantity = 1;
            node.lineItems.nodes[1].unfulfilledQuantity = 0;

            const order = gqlOrders.toRestOrder(node);
            assert.strictEqual(order.fulfillment_status, 'partial');
            assert.strictEqual(order.cancel_reason, 'customer');
            assert.strictEqual(order.line_items[0].fulfillment_status, 'partial');
            assert.strictEqual(order.line_items[1].fulfillment_status, 'fulfilled');

            node.displayFulfillmentStatus = 'FULFILLED';
            assert.strictEqual(gqlOrders.toRestOrder(node).fulfillment_status, 'fulfilled');
        });

        it('should return null for no order', () => {

            assert.strictEqual(gqlOrders.toRestOrder(null), null);
        });
    });

    describe('searchFrom / sortFrom', () => {

        it('should list open orders when no status is given', () => {

            assert.strictEqual(gqlOrders.searchFrom({}), 'status:open');
            assert.strictEqual(gqlOrders.searchFrom({ status: 'any' }), undefined);
        });

        it('should translate the REST filters', () => {

            assert.strictEqual(gqlOrders.searchFrom({
                status: 'closed',
                financial_status: 'paid',
                fulfillment_status: 'shipped',
                created_at_min: '2026-10-01',
                updated_at_max: '2026-10-02T10:00:00+02:00'
            }), "status:closed AND financial_status:paid AND fulfillment_status:shipped AND created_at:>='2026-10-01T00:00:00.000Z' AND updated_at:<='2026-10-02T08:00:00.000Z'");
            assert.strictEqual(gqlOrders.searchFrom({ status: 'any', financial_status: 'any', fulfillment_status: 'any' }), undefined);
            assert.strictEqual(gqlOrders.searchFrom({ status: 'any', customer_id: 'gid://shopify/Customer/5' }), 'customer_id:5');
        });

        it('should reject values that are not filters (no query injection)', () => {

            assert.throws(() => gqlOrders.searchFrom({ status: 'open OR id:1' }), err => err.statusCode === 422);
            assert.throws(() => gqlOrders.searchFrom({ created_at_min: "x' OR '1" }), err => err.statusCode === 422);
            assert.throws(() => gqlOrders.searchFrom({ customer_id: '1 OR 2' }), err => err.statusCode === 422);
        });

        it('should translate the REST order parameter', () => {

            assert.deepStrictEqual(gqlOrders.sortFrom('created_at DESC'), { sortKey: 'CREATED_AT', reverse: true });
            assert.deepStrictEqual(gqlOrders.sortFrom('updated_at DESC'), { sortKey: 'UPDATED_AT', reverse: true });
            assert.deepStrictEqual(gqlOrders.sortFrom('processed_at asc'), { sortKey: 'PROCESSED_AT', reverse: false });
            assert.deepStrictEqual(gqlOrders.sortFrom(undefined), { sortKey: 'CREATED_AT', reverse: true });
        });
    });

    describe('order', () => {

        it('get should query by gid and return the REST order', async () => {

            const { run, calls } = mockRun({ GetOrder: { order: createdOrderNode() } });
            const order = await gqlOrders(run).order.get(17287570063441);

            assert.deepStrictEqual(calls[0].variables, { id: 'gid://shopify/Order/17287570063441' });
            assert.strictEqual(order.id, 17287570063441);
            assert.strictEqual(order.email, 'gql-probe.order@example.com');
        });

        it('get should throw 404 when the order does not exist', async () => {

            const { run } = mockRun({ GetOrder: { order: null } });
            await assert.rejects(gqlOrders(run).order.get(1), err => err.statusCode === 404);
        });

        it('get should fetch the remaining line items of a large order', async () => {

            const node = createdOrderNode();
            const second = node.lineItems.nodes.pop();
            node.lineItems.pageInfo = { hasNextPage: true, endCursor: 'cursor-1' };
            const { run, calls } = mockRun({
                GetOrder: { order: node },
                OrderLineItems: { order: { lineItems: { nodes: [second], pageInfo: { hasNextPage: false, endCursor: 'cursor-2' } } } }
            });

            const order = await gqlOrders(run).order.get(17287570063441);
            assert.deepStrictEqual(calls[1].variables, { id: 'gid://shopify/Order/17287570063441', after: 'cursor-1' });
            assert.strictEqual(order.line_items.length, 2);
            assert.strictEqual(order.total_line_items_price, '1784.40');
        });

        it('list should translate filters, sort and paging', async () => {

            const { run, calls } = mockRun({
                ListOrders: { orders: { nodes: [createdOrderNode()], pageInfo: { hasNextPage: true, endCursor: 'next-cursor' } } }
            });
            const params = { limit: 1, status: 'cancelled', order: 'updated_at DESC' };
            const orders = await gqlOrders(run).order.list(params);

            assert.deepStrictEqual(calls[0].variables, {
                first: 1, after: null, query: 'status:cancelled', sortKey: 'UPDATED_AT', reverse: true
            });
            assert.strictEqual(orders.length, 1);
            assert.deepStrictEqual(orders.nextPageParameters, { ...params, after: 'next-cursor' });
            assert.strictEqual(Object.keys(orders).includes('nextPageParameters'), false);
        });

        it('list should default to open orders, newest first, and cap the page at 50', async () => {

            const { run, calls } = mockRun({
                ListOrders: { orders: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } }
            });
            const orders = await gqlOrders(run).order.list({ limit: 250, after: 'c1' });

            assert.deepStrictEqual(calls[0].variables, {
                first: 50, after: 'c1', query: 'status:open', sortKey: 'CREATED_AT', reverse: true
            });
            assert.deepStrictEqual(orders, []);
            assert.strictEqual(orders.nextPageParameters, undefined);
        });

        it('count should use the same filters', async () => {

            const { run, calls } = mockRun({ CountOrders: { ordersCount: { count: 3 } } });
            const count = await gqlOrders(run).order.count({ status: 'any', fulfillment_status: 'unshipped' });

            assert.strictEqual(count, 3);
            assert.deepStrictEqual(calls[0].variables, { query: 'fulfillment_status:unshipped' });
            assert.ok(calls[0].query.includes('limit: null'));
        });

        it('create should send OrderCreateOrderInput built from the CreateOrder payload', async () => {

            const { run, calls } = mockRun({
                ShopCurrency: { shop: { currencyCode: 'USD' } },
                CreateOrder: { orderCreate: { order: { id: 'gid://shopify/Order/17287570063441' }, userErrors: [] } },
                GetOrder: { order: createdOrderNode() }
            });

            const order = await gqlOrders(run).order.create({
                email: 'gql-probe.order@example.com',
                phone: '+420777123456',
                currency: undefined,
                note: 'gql-probe order',
                tags: 'gql-probe, e2e',
                test: true,
                customer: { first_name: 'Gql', last_name: 'Probe', email: 'gql-probe.order@example.com', accepts_marketing: true },
                line_items: [
                    { variant_id: 62788973264977, quantity: 2 },
                    { title: 'gql-probe custom item', price: '12.50', grams: '300', quantity: '1', taxable: true, requires_shipping: true }
                ],
                buyer_accepts_marketing: false,
                financial_status: 'pending',
                fulfillment_status: null,
                total_discounts: '',
                discount_codes: [{ code: 'GQLPROBE5', amount: '5.00', type: 'fixed_amount' }],
                taxes_included: false,
                tax_lines: [{ title: 'gql-probe VAT', price: '2.10', rate: 0.21 }],
                billing_address: { first_name: 'Gql', last_name: 'Probe', address1: 'Main 1', city: 'Prague', country: 'cz', zip: '11000' },
                shipping_address: { first_name: 'Gql', last_name: 'Probe', address1: 'Main 2', city: 'Toronto', country: 'CA', province: 'ON', zip: 'M5V 2T6' }
            });

            assert.deepStrictEqual(calls.map(call => call.name), ['ShopCurrency', 'CreateOrder', 'GetOrder']);
            const bag = amount => ({ shopMoney: { amount, currencyCode: 'USD' } });
            assert.deepStrictEqual(calls[1].variables, {
                order: {
                    email: 'gql-probe.order@example.com',
                    phone: '+420777123456',
                    note: 'gql-probe order',
                    test: true,
                    buyerAcceptsMarketing: false,
                    taxesIncluded: false,
                    financialStatus: 'PENDING',
                    tags: ['gql-probe', 'e2e'],
                    customer: { toUpsert: { email: 'gql-probe.order@example.com', firstName: 'Gql', lastName: 'Probe' } },
                    lineItems: [
                        { quantity: 2, variantId: 'gid://shopify/ProductVariant/62788973264977' },
                        {
                            quantity: 1, title: 'gql-probe custom item', priceSet: bag('12.50'),
                            weight: { value: 300, unit: 'GRAMS' }, taxable: true, requiresShipping: true
                        }
                    ],
                    discountCode: { itemFixedDiscountCode: { code: 'GQLPROBE5', amountSet: bag('5.00') } },
                    taxLines: [{ title: 'gql-probe VAT', rate: '0.21', priceSet: bag('2.10') }],
                    billingAddress: { firstName: 'Gql', lastName: 'Probe', address1: 'Main 1', city: 'Prague', countryCode: 'CZ', zip: '11000' },
                    shippingAddress: { firstName: 'Gql', lastName: 'Probe', address1: 'Main 2', city: 'Toronto', provinceCode: 'ON', countryCode: 'CA', zip: 'M5V 2T6' }
                },
                options: { inventoryBehaviour: 'BYPASS', sendReceipt: false, sendFulfillmentReceipt: false }
            });
            assert.strictEqual(order.id, 17287570063441);
            assert.ok(order.line_items.length);
        });

        it('create should associate an existing customer and map percentage / shipping codes', () => {

            const input = gqlOrders.toOrderCreateInput({
                customer: { id: '27599110930513' },
                line_items: [{ variant_id: 'gid://shopify/ProductVariant/1', quantity: 1 }],
                fulfillment_status: 'fulfilled',
                discount_codes: [{ code: 'PCT10', amount: '10', type: 'percentage' }]
            }, null);

            assert.deepStrictEqual(input.customer, { toAssociate: { id: 'gid://shopify/Customer/27599110930513' } });
            assert.strictEqual(input.fulfillmentStatus, 'FULFILLED');
            assert.deepStrictEqual(input.discountCode, { itemPercentageDiscountCode: { code: 'PCT10', percentage: 10 } });

            const shipping = gqlOrders.toOrderCreateInput({ line_items: [], discount_codes: [{ code: 'SHIP', amount: '', type: 'shipping' }] }, 'USD');
            assert.deepStrictEqual(shipping.discountCode, { freeShippingDiscountCode: { code: 'SHIP' } });
        });

        it('create should not query the shop currency when no price is sent', async () => {

            const { run, calls } = mockRun({
                CreateOrder: { orderCreate: { order: { id: 'gid://shopify/Order/1' }, userErrors: [] } },
                GetOrder: { order: createdOrderNode() }
            });
            await gqlOrders(run).order.create({ line_items: [{ variant_id: 1, quantity: 1 }] });
            assert.deepStrictEqual(calls.map(call => call.name), ['CreateOrder', 'GetOrder']);
        });

        it('create should turn userErrors into a 422', async () => {

            // Recorded live for a non-existent variant.
            const { run } = mockRun({
                CreateOrder: { orderCreate: { order: null, userErrors: [{ field: ['order', 'lineItems'], message: 'Line items product variant 1 not found, `price` must provided.' }] } }
            });
            await assert.rejects(
                gqlOrders(run).order.create({ email: 'x', line_items: [{ variant_id: 1, quantity: 1 }] }),
                err => err.statusCode === 422 && /product variant 1 not found/.test(err.message)
            );
        });

        it('create should reject more than one discount code', () => {

            assert.throws(() => gqlOrders.toOrderCreateInput({
                line_items: [],
                discount_codes: [{ code: 'A', amount: '1', type: 'fixed_amount' }, { code: 'B', amount: '1', type: 'fixed_amount' }]
            }, 'USD'), err => err.statusCode === 422);
        });

        it('update should send OrderInput and return the re-read order', async () => {

            const { run, calls } = mockRun({
                UpdateOrder: { orderUpdate: { order: { id: 'gid://shopify/Order/17287570063441' }, userErrors: [] } },
                GetOrder: { order: createdOrderNode() }
            });
            const order = await gqlOrders(run).order.update('17287570063441', {
                buyer_accepts_marketing: true,
                id: '17287570063441',
                email: 'gql-probe.updated@example.com',
                note: 'gql-probe updated',
                tags: 'gql-probe, updated',
                shipping_address: { first_name: 'Gql', last_name: 'Updated', address1: 'Main 3', city: 'Brno', country: 'CZ', zip: '60200' }
            });

            assert.deepStrictEqual(calls[0].variables, { input: {
                id: 'gid://shopify/Order/17287570063441',
                email: 'gql-probe.updated@example.com',
                note: 'gql-probe updated',
                tags: ['gql-probe', 'updated'],
                shippingAddress: { firstName: 'Gql', lastName: 'Updated', address1: 'Main 3', city: 'Brno', countryCode: 'CZ', zip: '60200' }
            } });
            assert.strictEqual(calls[1].name, 'GetOrder');
            assert.strictEqual(order.id, 17287570063441);
        });

        it('delete should return {} and map NOT_FOUND to 404', async () => {

            const ok = mockRun({ DeleteOrder: { orderDelete: { deletedId: 'gid://shopify/Order/5', userErrors: [] } } });
            assert.deepStrictEqual(await gqlOrders(ok.run).order.delete(5), {});
            assert.deepStrictEqual(ok.calls[0].variables, { orderId: 'gid://shopify/Order/5' });

            // Recorded live for a non-existent order.
            const missing = mockRun({ DeleteOrder: { orderDelete: { deletedId: null, userErrors: [{ field: ['orderId'], message: 'Order does not exist', code: 'NOT_FOUND' }] } } });
            await assert.rejects(gqlOrders(missing.run).order.delete(1), err => err.statusCode === 404);

            const invalid = mockRun({ DeleteOrder: { orderDelete: { deletedId: null, userErrors: [{ field: ['orderId'], message: 'Cannot delete', code: 'INVALID' }] } } });
            await assert.rejects(gqlOrders(invalid.run).order.delete(1), err => err.statusCode === 422);
        });
    });

    describe('refund.list', () => {

        it('should return REST refunds of the order', async () => {

            const { run, calls } = mockRun({ OrderRefunds: { order: refundOrderNode() } });
            const refunds = await gqlOrders(run).refund.list(17287385874513, { limit: 1 });

            assert.deepStrictEqual(calls[0].variables, { id: 'gid://shopify/Order/17287385874513', first: 1 });
            assert.strictEqual(refunds.length, 1);
            const [refund] = refunds;
            assert.strictEqual(refund.id, 1221755568209);
            assert.strictEqual(refund.order_id, 17287385874513);
            assert.strictEqual(refund.note, 'Appmixer E2E refund');
            assert.strictEqual(refund.restock, false);
            assert.strictEqual(refund.refund_line_items[0].line_item_id, 46363944058961);
            assert.strictEqual(refund.refund_line_items[0].restock_type, 'no_restock');
            assert.strictEqual(refund.refund_line_items[0].subtotal, 9.99);
            assert.strictEqual(refund.refund_line_items[0].line_item.title, 'Appmixer E2E Trigger Item');
            // Refunded units are not fulfillable.
            assert.strictEqual(refund.refund_line_items[0].line_item.fulfillable_quantity, 0);
            assert.deepStrictEqual(
                refund.transactions.map(t => [t.kind, t.status, t.amount, t.currency, t.parent_id]),
                [['refund', 'success', '9.99', 'USD', 9000000000000]]
            );
            assert.deepStrictEqual(refund.order_adjustments, []);
            assert.strictEqual(refunds.nextPageParameters, undefined);
        });

        it('should throw 404 for a missing order', async () => {

            const { run } = mockRun({ OrderRefunds: { order: null } });
            await assert.rejects(gqlOrders(run).refund.list(1), err => err.statusCode === 404);
        });
    });

    describe('fulfillment.list', () => {

        it('should return REST fulfillments of the order', async () => {

            const { run, calls } = mockRun({ OrderFulfillments: { order: fulfillmentOrderNode() } });
            const [fulfillment] = await gqlOrders(run).fulfillment.list('17287389675601', { limit: 1 });

            assert.deepStrictEqual(calls[0].variables, { id: 'gid://shopify/Order/17287389675601', first: 1 });
            assert.strictEqual(fulfillment.id, 9264261333073);
            assert.strictEqual(fulfillment.order_id, 17287389675601);
            assert.strictEqual(fulfillment.name, '#1010-F1');
            assert.strictEqual(fulfillment.status, 'success');
            assert.strictEqual(fulfillment.service, 'manual');
            assert.strictEqual(fulfillment.location_id, 124679880785);
            assert.strictEqual(fulfillment.tracking_company, 'Other');
            assert.strictEqual(fulfillment.tracking_number, 'E2E-TRACK-1');
            assert.deepStrictEqual(fulfillment.tracking_numbers, ['E2E-TRACK-1']);
            assert.strictEqual(fulfillment.tracking_url, null);
            assert.deepStrictEqual(fulfillment.tracking_urls, []);
            assert.strictEqual(fulfillment.shipment_status, null);
            assert.strictEqual(fulfillment.line_items[0].id, 46363949891665);
            assert.strictEqual(fulfillment.line_items[0].quantity, 1);
            assert.strictEqual(fulfillment.line_items[0].fulfillment_status, 'fulfilled');
        });
    });

    describe('listForCustomer', () => {

        it('should list the customer\'s open orders by default', async () => {

            const { run, calls } = mockRun({ ListOrders: { orders: { nodes: [], pageInfo: { hasNextPage: false } } } });
            await gqlOrders(run).listForCustomer(27598846558289);
            assert.strictEqual(calls[0].variables.query, 'status:open AND customer_id:27598846558289');

            await gqlOrders(run).listForCustomer('27598846558289', { status: 'any' });
            assert.strictEqual(calls[1].variables.query, 'customer_id:27598846558289');
        });
    });
});
