const assert = require('assert');
const gqlDiscounts = require('../../gql-discounts');

// Recorded from the QA store (API 2026-10), trimmed.
const BASIC_PERCENTAGE_NODE = {
    id: 'gid://shopify/DiscountCodeNode/2381817839697',
    codeDiscount: {
        __typename: 'DiscountCodeBasic',
        title: 'gql-probe discount',
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: '2026-12-31T23:59:59Z',
        usageLimit: 100,
        appliesOncePerCustomer: true,
        createdAt: '2026-10-02T14:34:38Z',
        updatedAt: '2026-10-02T14:34:38Z',
        context: { __typename: 'DiscountBuyerSelectionAll' },
        minimumRequirement: {
            __typename: 'DiscountMinimumSubtotal',
            greaterThanOrEqualToSubtotal: { amount: '50.0' }
        },
        customerGets: {
            items: { __typename: 'AllDiscountItems' },
            value: { __typename: 'DiscountPercentage', percentage: 0.15 }
        },
        codes: {
            nodes: [{
                id: 'gid://shopify/DiscountRedeemCode/34876426813521',
                code: 'GQLPROBE15',
                asyncUsageCount: 0,
                createdAt: '2026-10-02T14:34:38Z'
            }]
        }
    }
};

const BASIC_FIXED_NODE = {
    id: 'gid://shopify/DiscountCodeNode/2381818003537',
    codeDiscount: {
        __typename: 'DiscountCodeBasic',
        title: 'gql-probe fixed',
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: null,
        usageLimit: null,
        appliesOncePerCustomer: false,
        createdAt: '2026-10-02T14:34:54Z',
        updatedAt: '2026-10-02T14:34:54Z',
        context: { __typename: 'DiscountBuyerSelectionAll' },
        minimumRequirement: null,
        customerGets: {
            items: { __typename: 'AllDiscountItems' },
            value: { __typename: 'DiscountAmount', amount: { amount: '5.5' }, appliesOnEachItem: false }
        },
        codes: { nodes: [] }
    }
};

function mockRun(responses) {

    const calls = [];
    const run = async (query, variables) => {
        calls.push({ query, variables });
        const response = responses[calls.length - 1];
        return typeof response === 'function' ? response(query, variables) : response;
    };
    return { run, calls };
}

describe('Shopify GraphQL discounts', () => {

    describe('toRestPriceRule', () => {

        it('should map a percentage basic code discount to the REST price rule', () => {

            assert.deepStrictEqual(gqlDiscounts.toRestPriceRule(BASIC_PERCENTAGE_NODE), {
                'id': 2381817839697,
                'title': 'gql-probe discount',
                'value_type': 'percentage',
                'value': '-15.0',
                'target_type': 'line_item',
                'target_selection': 'all',
                'allocation_method': 'across',
                'customer_selection': 'all',
                'once_per_customer': true,
                'usage_limit': 100,
                'starts_at': '2026-10-01T00:00:00Z',
                'ends_at': '2026-12-31T23:59:59Z',
                'prerequisite_subtotal_range': { 'greater_than_or_equal_to': '50.0' },
                'created_at': '2026-10-02T14:34:38Z',
                'updated_at': '2026-10-02T14:34:38Z'
            });
        });

        it('should map a fixed amount without minimum and keep the empty keys', () => {

            const rule = gqlDiscounts.toRestPriceRule(BASIC_FIXED_NODE);
            assert.strictEqual(rule['value_type'], 'fixed_amount');
            assert.strictEqual(rule.value, '-5.5');
            assert.strictEqual(rule['ends_at'], null);
            assert.strictEqual(rule['usage_limit'], null);
            assert.strictEqual(rule['prerequisite_subtotal_range'], null);
        });

        it('should avoid float noise and map free shipping and per-item amounts', () => {

            const node = (codeDiscount) => ({ id: 'gid://shopify/DiscountCodeNode/1', codeDiscount });
            const percent = gqlDiscounts.toRestPriceRule(node({
                __typename: 'DiscountCodeBasic',
                customerGets: { items: { __typename: 'DiscountProducts' }, value: { percentage: 0.07 } },
                context: { __typename: 'DiscountCustomers' }
            }));
            assert.strictEqual(percent.value, '-7.0');
            assert.strictEqual(percent['target_selection'], 'entitled');
            assert.strictEqual(percent['customer_selection'], 'prerequisite');

            const each = gqlDiscounts.toRestPriceRule(node({
                __typename: 'DiscountCodeBasic',
                customerGets: { items: { __typename: 'AllDiscountItems' }, value: { amount: { amount: '10.0' }, appliesOnEachItem: true } }
            }));
            assert.strictEqual(each.value, '-10.0');
            assert.strictEqual(each['allocation_method'], 'each');

            const shipping = gqlDiscounts.toRestPriceRule(node({ __typename: 'DiscountCodeFreeShipping', title: 'Ship' }));
            assert.strictEqual(shipping['target_type'], 'shipping_line');
            assert.strictEqual(shipping.value, '-100.0');
        });
    });

    describe('basicCodeInput', () => {

        it('should translate the REST-like parameters', () => {

            const input = gqlDiscounts.basicCodeInput({
                code: 'SUMMER15', valueType: 'percentage', amount: -15, startsAt: '2026-10-01T00:00:00Z',
                endsAt: '2026-12-31T23:59:59Z', usageLimit: '100', oncePerCustomer: true, minimumSubtotal: 50
            });
            assert.deepStrictEqual(input, {
                title: 'SUMMER15',
                code: 'SUMMER15',
                startsAt: '2026-10-01T00:00:00Z',
                endsAt: '2026-12-31T23:59:59Z',
                usageLimit: 100,
                appliesOncePerCustomer: true,
                context: { all: 'ALL' },
                minimumRequirement: { subtotal: { greaterThanOrEqualToSubtotal: '50' } },
                customerGets: { items: { all: true }, value: { percentage: 0.15 } }
            });

            const fixed = gqlDiscounts.basicCodeInput({ code: 'X', title: 'T', valueType: 'fixed_amount', amount: 5.5 });
            assert.deepStrictEqual(fixed.customerGets.value, { discountAmount: { amount: '5.5', appliesOnEachItem: false } });
            assert.strictEqual(fixed.title, 'T');
            assert.ok(fixed.startsAt, 'startsAt defaults to now');
            assert.strictEqual(fixed.minimumRequirement, undefined);
            assert.strictEqual(fixed.endsAt, undefined);
        });
    });

    describe('createBasicCode', () => {

        it('should create the discount and return the REST discount code with its price rule', async () => {

            const { run, calls } = mockRun([{
                discountCodeBasicCreate: { codeDiscountNode: BASIC_PERCENTAGE_NODE, userErrors: [] }
            }]);

            const result = await gqlDiscounts(run).createBasicCode({ code: 'GQLPROBE15', valueType: 'percentage', amount: 15 });

            assert.match(calls[0].query, /discountCodeBasicCreate\(basicCodeDiscount: \$input\)/);
            assert.strictEqual(calls[0].variables.input.code, 'GQLPROBE15');
            assert.strictEqual(result.id, 34876426813521);
            assert.strictEqual(result.code, 'GQLPROBE15');
            assert.strictEqual(result['price_rule_id'], 2381817839697);
            assert.strictEqual(result['usage_count'], 0);
            assert.strictEqual(result['price_rule'].id, 2381817839697);
        });

        it('should turn userErrors into a 422', async () => {

            const { run } = mockRun([{
                discountCodeBasicCreate: {
                    codeDiscountNode: null,
                    userErrors: [{ field: ['basicCodeDiscount', 'code'], message: 'Code must be unique. Please try a different code.', code: 'TAKEN' }]
                }
            }]);

            await assert.rejects(
                gqlDiscounts(run).createBasicCode({ code: 'GQLPROBE15', valueType: 'percentage', amount: 15 }),
                error => error.statusCode === 422 && /Code must be unique/.test(error.message)
            );
        });
    });

    describe('lookupCode', () => {

        it('should match the code case-insensitively among the discount codes', async () => {

            const node = JSON.parse(JSON.stringify(BASIC_PERCENTAGE_NODE));
            node.codeDiscount.codes.nodes.unshift({ id: 'gid://shopify/DiscountRedeemCode/1', code: 'OTHER', asyncUsageCount: 9, createdAt: 'x' });
            node.codeDiscount.matchingCodes = { nodes: [] };
            const { run, calls } = mockRun([{ codeDiscountNodeByCode: node }]);

            const result = await gqlDiscounts(run).lookupCode('gqlprobe15');

            assert.deepStrictEqual(calls[0].variables, { code: 'gqlprobe15', codeQuery: '"gqlprobe15"' });
            assert.strictEqual(result.id, 34876426813521);
            assert.strictEqual(result.code, 'GQLPROBE15');
            assert.strictEqual(result['price_rule'].title, 'gql-probe discount');
        });

        it('should escape quotes in the code search and return null when not found', async () => {

            const { run, calls } = mockRun([{ codeDiscountNodeByCode: null }]);

            assert.strictEqual(await gqlDiscounts(run).lookupCode('A"B'), null);
            assert.strictEqual(calls[0].variables.codeQuery, '"A\\"B"');
        });
    });

    describe('deleteDiscount', () => {

        it('should accept a numeric id or a gid', async () => {

            const { run, calls } = mockRun([
                { discountCodeDelete: { deletedCodeDiscountId: 'gid://shopify/DiscountCodeNode/42', userErrors: [] } },
                { discountCodeDelete: { deletedCodeDiscountId: 'gid://shopify/DiscountCodeNode/42', userErrors: [] } }
            ]);
            const api = gqlDiscounts(run);

            await api.deleteDiscount(42);
            await api.deleteDiscount('gid://shopify/DiscountCodeNode/42');

            assert.deepStrictEqual(calls.map(call => call.variables.id), [
                'gid://shopify/DiscountCodeNode/42',
                'gid://shopify/DiscountCodeNode/42'
            ]);
        });

        it('should report a missing discount as a 422', async () => {

            const { run } = mockRun([{
                discountCodeDelete: {
                    deletedCodeDiscountId: null,
                    userErrors: [{ field: ['id'], message: 'Code discount does not exist.', code: 'INVALID' }]
                }
            }]);

            await assert.rejects(gqlDiscounts(run).deleteDiscount(1), error => error.statusCode === 422);
        });
    });
});
