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
// message, and answers the GraphQL requests from the supplied handler with the
// operation's `data`.
function mockContext(content, handler) {

    const context = {
        auth: { store: 'test-store', accessToken: 'shpat_test' },
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        async httpRequest(options) {
            context.requests.push(options);
            const data = await handler(options.data, context.requests.length - 1);
            return { data: { data }, headers: {} };
        },
        async sendJson(payload, port) {
            context.sent.push({ payload, port });
        }
    };

    return context;
}

// The discount node as discountCodeBasicCreate / codeDiscountNodeByCode return
// it, built from the mutation input so the assertions see what was sent.
function discountNode(input) {

    const value = input.customerGets.value;
    const minimum = input.minimumRequirement && input.minimumRequirement.subtotal.greaterThanOrEqualToSubtotal;
    return {
        id: 'gid://shopify/DiscountCodeNode/42',
        codeDiscount: {
            __typename: 'DiscountCodeBasic',
            title: input.title,
            startsAt: input.startsAt,
            endsAt: input.endsAt || null,
            usageLimit: input.usageLimit || null,
            appliesOncePerCustomer: input.appliesOncePerCustomer,
            createdAt: '2026-10-02T14:34:38Z',
            updatedAt: '2026-10-02T14:34:38Z',
            context: { __typename: 'DiscountBuyerSelectionAll' },
            minimumRequirement: minimum
                ? { __typename: 'DiscountMinimumSubtotal', greaterThanOrEqualToSubtotal: { amount: `${minimum}.0` } }
                : null,
            customerGets: {
                items: { __typename: 'AllDiscountItems' },
                value: value.percentage !== undefined
                    ? { __typename: 'DiscountPercentage', percentage: value.percentage }
                    : { __typename: 'DiscountAmount', amount: { amount: value.discountAmount.amount }, appliesOnEachItem: false }
            },
            codes: {
                nodes: [{ id: 'gid://shopify/DiscountRedeemCode/7', code: input.code, asyncUsageCount: 0, createdAt: '2026-10-02T14:34:38Z' }]
            }
        }
    };
}

function created(body) {

    return { discountCodeBasicCreate: { codeDiscountNode: discountNode(body.variables.input), userErrors: [] } };
}

describe('Shopify discounts', function() {

    // lib.js spaces Admin API calls 500ms apart to stay under the Shopify rate limit.
    this.timeout(15000);

    describe('CreateDiscountCode', () => {

        it('should create the discount with the code and return it in the price rule shape', async () => {

            const context = mockContext({
                valueType: 'percentage',
                value: 15,
                code: ' SUMMER15 ',
                endsAt: '2026-12-31T23:59:59Z',
                usageLimit: 100,
                oncePerCustomer: true,
                prerequisiteSubtotalRange: 50
            }, created);

            await CreateDiscountCode.receive(context);

            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].method, 'POST');
            assert.ok(context.requests[0].url.endsWith('/admin/api/2026-10/graphql.json'));
            assert.match(context.requests[0].data.query, /discountCodeBasicCreate/);

            const input = context.requests[0].data.variables.input;
            assert.strictEqual(input.code, 'SUMMER15');
            assert.strictEqual(input.title, 'SUMMER15');
            assert.deepStrictEqual(input.customerGets, { items: { all: true }, value: { percentage: 0.15 } });
            assert.deepStrictEqual(input.context, { all: 'ALL' });
            assert.strictEqual(input.endsAt, '2026-12-31T23:59:59Z');
            assert.strictEqual(input.usageLimit, 100);
            assert.strictEqual(input.appliesOncePerCustomer, true);
            assert.deepStrictEqual(input.minimumRequirement, { subtotal: { greaterThanOrEqualToSubtotal: '50' } });
            assert.ok(input.startsAt, 'startsAt defaults to the current time');

            assert.strictEqual(context.sent.length, 1);
            const { payload, port } = context.sent[0];
            assert.strictEqual(port, 'out');
            assert.strictEqual(payload.id, 7);
            assert.strictEqual(payload.code, 'SUMMER15');
            assert.strictEqual(payload['price_rule_id'], 42);
            assert.strictEqual(payload['price_rule'].id, 42);
            // The API value is negative, like the REST price rule's.
            assert.strictEqual(payload['price_rule'].value, '-15.0');
            assert.strictEqual(payload['price_rule']['value_type'], 'percentage');
            assert.strictEqual(payload['price_rule']['target_type'], 'line_item');
            assert.strictEqual(payload['price_rule']['target_selection'], 'all');
            assert.strictEqual(payload['price_rule']['allocation_method'], 'across');
            assert.strictEqual(payload['price_rule']['customer_selection'], 'all');
            assert.deepStrictEqual(payload['price_rule']['prerequisite_subtotal_range'], { 'greater_than_or_equal_to': '50.0' });
        });

        it('should generate a code when none is given', async () => {

            const context = mockContext({ valueType: 'fixed_amount', value: -5 }, created);

            await CreateDiscountCode.receive(context);

            const input = context.requests[0].data.variables.input;
            // Unambiguous alphabet only — no I, O, 0 or 1.
            assert.match(input.code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
            // The discount is titled after the generated code.
            assert.strictEqual(input.title, input.code);
            assert.deepStrictEqual(input.customerGets.value, { discountAmount: { amount: '5', appliesOnEachItem: false } });
            assert.strictEqual(input.minimumRequirement, undefined);
            assert.strictEqual(context.sent[0].payload.code, input.code);
            assert.strictEqual(context.sent[0].payload['price_rule'].value, '-5.0');
        });

        it('should fail with a 422 and leave nothing behind when the code is refused', async () => {

            const context = mockContext({ valueType: 'percentage', value: 15, code: 'TAKEN' }, () => ({
                discountCodeBasicCreate: {
                    codeDiscountNode: null,
                    userErrors: [{ field: ['basicCodeDiscount', 'code'], message: 'Code must be unique. Please try a different code.', code: 'TAKEN' }]
                }
            }));

            await assert.rejects(CreateDiscountCode.receive(context), error => error.statusCode === 422);

            // Terms and code are created in one mutation: a refused code creates
            // no discount, so there is nothing to roll back.
            assert.strictEqual(context.requests.length, 1);
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

        it('should return the code together with the terms of its discount', async () => {

            const node = discountNode({
                title: 'Summer sale 15%',
                code: 'SUMMER15',
                startsAt: '2026-10-01T00:00:00Z',
                endsAt: '2026-12-31T23:59:59Z',
                usageLimit: 100,
                appliesOncePerCustomer: false,
                minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: '50' } },
                customerGets: { value: { percentage: 0.15 } }
            });
            const context = mockContext({ code: ' summer15 ' }, body => {
                assert.match(body.query, /codeDiscountNodeByCode\(code: \$code\)/);
                assert.deepStrictEqual(body.variables, { code: 'summer15', codeQuery: '"summer15"' });
                return { codeDiscountNodeByCode: node };
            });

            await GetDiscountCode.receive(context);

            assert.strictEqual(context.requests.length, 1);
            assert.deepStrictEqual(context.sent[0], {
                port: 'out',
                payload: {
                    'id': 7,
                    'code': 'SUMMER15',
                    'price_rule_id': 42,
                    'usage_count': 0,
                    'created_at': '2026-10-02T14:34:38Z',
                    'updated_at': '2026-10-02T14:34:38Z',
                    'price_rule': {
                        'id': 42,
                        'title': 'Summer sale 15%',
                        'value_type': 'percentage',
                        'value': '-15.0',
                        'target_type': 'line_item',
                        'target_selection': 'all',
                        'allocation_method': 'across',
                        'customer_selection': 'all',
                        'once_per_customer': false,
                        'usage_limit': 100,
                        'starts_at': '2026-10-01T00:00:00Z',
                        'ends_at': '2026-12-31T23:59:59Z',
                        'prerequisite_subtotal_range': { 'greater_than_or_equal_to': '50.0' },
                        'created_at': '2026-10-02T14:34:38Z',
                        'updated_at': '2026-10-02T14:34:38Z'
                    }
                }
            });
        });

        it('should cancel on an unknown code and on a missing input', async () => {

            await assert.rejects(
                GetDiscountCode.receive(mockContext({ code: 'NOPE' }, () => ({ codeDiscountNodeByCode: null }))),
                error => error instanceof CancelError && /Discount code NOPE was not found/.test(error.message)
            );
            await assert.rejects(
                GetDiscountCode.receive(mockContext({}, () => assert.fail('no request expected'))),
                /Discount Code is required/
            );
        });
    });
});
