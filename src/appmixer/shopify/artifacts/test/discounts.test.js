const assert = require('assert');
const CreateDiscountCode = require('../../discounts/CreateDiscountCode/CreateDiscountCode');
const GetDiscountCode = require('../../discounts/GetDiscountCode/GetDiscountCode');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

// Minimal component context: records every Admin API call and every emitted
// message, and answers requests from the supplied handler.
function mockContext(content, handler) {

    const context = {
        auth: { store: 'test-store', accessToken: 'shpat_test' },
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        async httpRequest(options) {
            context.requests.push(options);
            return handler(options, context.requests.length - 1);
        },
        async sendJson(payload, port) {
            context.sent.push({ payload, port });
        }
    };

    return context;
}

function notFoundError() {

    const error = new Error('Not Found');
    error.response = { status: 404, statusText: 'Not Found', headers: {} };
    return error;
}

const DISCOUNT_CODE = { id: 7, code: 'SUMMER15', 'price_rule_id': 42, 'usage_count': 3 };
const PRICE_RULE = { id: 42, title: 'Summer sale 15%', 'value_type': 'percentage', value: '-15.0' };

// lib.js spaces Admin API calls 500ms apart to stay under the Shopify rate
// limit, so a few mocked calls in a row outlast mocha's default timeout.
describe('Shopify discounts', function() {

    this.timeout(15000);

    describe('CreateDiscountCode', () => {

        it('should create the price rule with a negative value and attach the code to it', async () => {

            const context = mockContext({
                valueType: 'percentage',
                value: 15,
                code: ' SUMMER15 ',
                endsAt: '2026-12-31T23:59:59Z',
                usageLimit: 100,
                oncePerCustomer: true,
                prerequisiteSubtotalRange: 50
            }, (options, index) => {
                if (index === 0) {
                    return { data: { 'price_rule': { id: 42, ...options.data['price_rule'] } }, headers: {} };
                }
                return { data: { 'discount_code': { id: 7, code: 'SUMMER15', 'price_rule_id': 42, 'usage_count': 0 } }, headers: {} };
            });

            await CreateDiscountCode.receive(context);

            const priceRule = context.requests[0].data['price_rule'];
            assert.strictEqual(context.requests[0].method, 'POST');
            assert.ok(context.requests[0].url.endsWith('/price_rules.json'));
            assert.strictEqual(priceRule.value, '-15');
            assert.strictEqual(priceRule['value_type'], 'percentage');
            assert.strictEqual(priceRule['target_type'], 'line_item');
            assert.strictEqual(priceRule['target_selection'], 'all');
            assert.strictEqual(priceRule['customer_selection'], 'all');
            assert.strictEqual(priceRule.title, 'SUMMER15');
            assert.strictEqual(priceRule['ends_at'], '2026-12-31T23:59:59Z');
            assert.strictEqual(priceRule['usage_limit'], 100);
            assert.strictEqual(priceRule['once_per_customer'], true);
            assert.deepStrictEqual(priceRule['prerequisite_subtotal_range'], { 'greater_than_or_equal_to': '50' });
            assert.ok(priceRule['starts_at'], 'starts_at defaults to the current time');

            // The code hangs off the price rule that was just created.
            assert.ok(context.requests[1].url.endsWith('/price_rules/42/discount_codes.json'));
            assert.deepStrictEqual(context.requests[1].data, { 'discount_code': { code: 'SUMMER15' } });

            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].port, 'out');
            assert.strictEqual(context.sent[0].payload.code, 'SUMMER15');
            assert.strictEqual(context.sent[0].payload['price_rule'].id, 42);
        });

        it('should generate a code when none is given', async () => {

            const context = mockContext({ valueType: 'fixed_amount', value: 5 }, (options, index) => {
                if (index === 0) {
                    return { data: { 'price_rule': { id: 42, ...options.data['price_rule'] } }, headers: {} };
                }
                return { data: { 'discount_code': { id: 7, ...options.data['discount_code'] } }, headers: {} };
            });

            await CreateDiscountCode.receive(context);

            const generated = context.requests[1].data['discount_code'].code;
            // Unambiguous alphabet only — no I, O, 0 or 1.
            assert.match(generated, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
            // The price rule is titled after the generated code.
            assert.strictEqual(context.requests[0].data['price_rule'].title, generated);
            assert.strictEqual(context.sent[0].payload.code, generated);
        });

        it('should remove the price rule again when the code is refused', async () => {

            const context = mockContext({ valueType: 'percentage', value: 15, code: 'TAKEN' }, (options, index) => {
                if (index === 0) {
                    return { data: { 'price_rule': { id: 42, ...options.data['price_rule'] } }, headers: {} };
                }
                if (index === 1) {
                    const error = new Error('Unprocessable Entity');
                    error.response = { status: 422, statusText: 'Unprocessable Entity', headers: {} };
                    throw error;
                }
                return { data: {}, headers: {} };
            });

            await assert.rejects(CreateDiscountCode.receive(context), error => error.statusCode === 422);

            assert.strictEqual(context.requests.length, 3);
            assert.strictEqual(context.requests[2].method, 'DELETE');
            assert.ok(context.requests[2].url.endsWith('/price_rules/42.json'));
            assert.strictEqual(context.sent.length, 0);
        });

        it('should reject a missing or out-of-range value', async () => {

            const failing = () => assert.fail('no request expected');

            await assert.rejects(
                CreateDiscountCode.receive(mockContext({ valueType: 'percentage' }, failing)),
                /Discount Value is required/
            );
            await assert.rejects(
                CreateDiscountCode.receive(mockContext({ valueType: 'percentage', value: 120 }, failing)),
                /percentage discount cannot be greater than 100/
            );
            await assert.rejects(
                CreateDiscountCode.receive(mockContext({ valueType: 'percentage', value: 0 }, failing)),
                /must be a non-zero number/
            );
            await assert.rejects(
                CreateDiscountCode.receive(mockContext({ value: 10 }, failing)),
                /Discount Type is required/
            );
        });
    });

    describe('GetDiscountCode', () => {

        it('should return the code together with the terms of its price rule', async () => {

            const context = mockContext({ code: 'SUMMER15' }, (options, index) => {
                if (index === 0) {
                    assert.ok(options.url.endsWith('/discount_codes/lookup.json'));
                    assert.deepStrictEqual(options.params, { code: 'SUMMER15' });
                    return { data: { 'discount_code': DISCOUNT_CODE }, headers: {} };
                }
                assert.ok(options.url.endsWith('/price_rules/42.json'));
                return { data: { 'price_rule': PRICE_RULE }, headers: {} };
            });

            await GetDiscountCode.receive(context);

            assert.deepStrictEqual(context.sent[0], {
                port: 'out',
                payload: { ...DISCOUNT_CODE, 'price_rule': PRICE_RULE }
            });
        });

        it('should resolve the lookup redirect by hand when the client did not follow it', async () => {

            const context = mockContext({ code: 'SUMMER15' }, (options, index) => {
                if (index === 0) {
                    return {
                        data: {},
                        headers: { location: 'https://test-store.myshopify.com/admin/api/2024-04/price_rules/42/discount_codes/7.json' }
                    };
                }
                if (index === 1) {
                    assert.ok(options.url.endsWith('/price_rules/42/discount_codes/7.json'));
                    return { data: { 'discount_code': DISCOUNT_CODE }, headers: {} };
                }
                return { data: { 'price_rule': PRICE_RULE }, headers: {} };
            });

            await GetDiscountCode.receive(context);

            assert.strictEqual(context.requests.length, 3);
            assert.strictEqual(context.sent[0].payload.id, 7);
        });

        it('should cancel on an unknown code and on a missing input', async () => {

            await assert.rejects(
                GetDiscountCode.receive(mockContext({ code: 'NOPE' }, () => Promise.reject(notFoundError()))),
                /Discount code NOPE was not found/
            );
            await assert.rejects(
                GetDiscountCode.receive(mockContext({}, () => assert.fail('no request expected'))),
                /Discount Code is required/
            );
        });
    });
});
