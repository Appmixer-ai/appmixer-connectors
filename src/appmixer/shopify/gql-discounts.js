'use strict';
const client = require('./graphql-client');

// The GraphQL Admin API has no price rules: a code discount (DiscountCodeNode)
// carries both the terms and its redeem codes. The components keep the REST
// shape — a discount code with its `price_rule` — so the discount node stands
// in for the price rule (price_rule.id = price_rule_id = the node's numeric id)
// and the redeem code for the discount code.

const REDEEM_CODE = 'id code asyncUsageCount createdAt';

const DISCOUNT_VALUE = `
    __typename
    ... on DiscountPercentage { percentage }
    ... on DiscountAmount { amount { amount } appliesOnEachItem }
    ... on DiscountOnQuantity {
        effect {
            __typename
            ... on DiscountPercentage { percentage }
            ... on DiscountAmount { amount { amount } appliesOnEachItem }
        }
    }`;

const MINIMUM_REQUIREMENT = `
    minimumRequirement {
        __typename
        ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } }
    }`;

// Fields of each code discount type the REST price rule can be derived from.
const TYPE_FIELDS = {
    DiscountCodeBasic: `${MINIMUM_REQUIREMENT}
        customerGets { items { __typename } value { ${DISCOUNT_VALUE} } }`,
    DiscountCodeBxgy: `
        customerGets { items { __typename } value { ${DISCOUNT_VALUE} } }`,
    DiscountCodeFreeShipping: MINIMUM_REQUIREMENT,
    DiscountCodeApp: ''
};

// Build the codeDiscount selection: common fields on every code discount type,
// the type's own fields and the given selection of its redeem codes.
function codeDiscountSelection(codes) {

    const fragments = Object.keys(TYPE_FIELDS).map(type => `
        ... on ${type} {
            title
            startsAt
            endsAt
            usageLimit
            appliesOncePerCustomer
            createdAt
            updatedAt
            context { __typename }
            ${TYPE_FIELDS[type]}
            ${codes}
        }`).join('');
    return `codeDiscount { __typename ${fragments} }`;
}

const CREATE_BASIC_CODE = `mutation DiscountCodeBasicCreate($input: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $input) {
        codeDiscountNode {
            id
            ${codeDiscountSelection(`codes(first: 1) { nodes { ${REDEEM_CODE} } }`)}
        }
        userErrors { field message code }
    }
}`;

// A discount may hold many codes (bulk generated). The code search index lags
// behind a fresh create, so take the first page as well and match in code.
const LOOKUP_CODE = `query DiscountCodeByCode($code: String!, $codeQuery: String!) {
    codeDiscountNodeByCode(code: $code) {
        id
        ${codeDiscountSelection(`
            codes(first: 50) { nodes { ${REDEEM_CODE} } }
            matchingCodes: codes(first: 5, query: $codeQuery) { nodes { ${REDEEM_CODE} } }`)}
    }
}`;

const DELETE_CODE = `mutation DiscountCodeDelete($id: ID!) {
    discountCodeDelete(id: $id) {
        deletedCodeDiscountId
        userErrors { field message code }
    }
}`;

function typeOf(object) {

    return object ? object['__typename'] : undefined;
}

// 15 → '15.0', 5.5 → '5.5' (REST renders decimals with at least one digit).
function decimal(value) {

    const number = Math.round(Number(value) * 1e6) / 1e6;
    return Number.isInteger(number) ? number.toFixed(1) : String(number);
}

// DiscountCustomerGetsValue → REST value_type, value (negative) and allocation_method.
function discountValue(value) {

    const effect = typeOf(value) === 'DiscountOnQuantity' ? value.effect : value;
    if (effect && effect.percentage !== undefined) {
        return { valueType: 'percentage', value: decimal(-effect.percentage * 100), allocation: 'across' };
    }
    if (effect && effect.amount) {
        return {
            valueType: 'fixed_amount',
            value: decimal(-client.money(effect.amount)),
            allocation: effect.appliesOnEachItem ? 'each' : 'across'
        };
    }
    return { valueType: null, value: null, allocation: null };
}

/**
 * Map a DiscountCodeNode to the REST price rule shape.
 * @param {object} node DiscountCodeNode with codeDiscount
 * @returns {object}
 */
function toRestPriceRule(node) {

    const discount = node.codeDiscount || {};
    const type = typeOf(discount);
    const freeShipping = type === 'DiscountCodeFreeShipping';
    const gets = discount.customerGets;
    const items = gets && typeOf(gets.items);

    const terms = freeShipping
        ? { valueType: 'percentage', value: '-100.0', allocation: 'each' }
        : discountValue(gets && gets.value);
    if (type === 'DiscountCodeBxgy') {
        terms.allocation = 'each';
    }

    let targetSelection = null;
    if (freeShipping) {
        targetSelection = 'all';
    } else if (items) {
        targetSelection = items === 'AllDiscountItems' && type !== 'DiscountCodeBxgy' ? 'all' : 'entitled';
    }

    const minimum = discount.minimumRequirement;
    const subtotal = typeOf(minimum) === 'DiscountMinimumSubtotal'
        ? client.money(minimum.greaterThanOrEqualToSubtotal)
        : null;

    let customerSelection = null;
    if (discount.context) {
        customerSelection = typeOf(discount.context) === 'DiscountBuyerSelectionAll' ? 'all' : 'prerequisite';
    }

    return {
        'id': client.fromGid(node.id),
        'title': discount.title === undefined ? null : discount.title,
        'value_type': terms.valueType,
        'value': terms.value,
        'target_type': type === 'DiscountCodeApp' ? null : (freeShipping ? 'shipping_line' : 'line_item'),
        'target_selection': targetSelection,
        'allocation_method': terms.allocation,
        'customer_selection': customerSelection,
        'once_per_customer': discount.appliesOncePerCustomer === undefined ? null : discount.appliesOncePerCustomer,
        'usage_limit': discount.usageLimit === undefined ? null : discount.usageLimit,
        'starts_at': discount.startsAt || null,
        'ends_at': discount.endsAt || null,
        'prerequisite_subtotal_range': subtotal === null ? null : { 'greater_than_or_equal_to': subtotal },
        'created_at': discount.createdAt || null,
        'updated_at': discount.updatedAt || null
    };
}

/**
 * Map a DiscountCodeNode and one of its redeem codes to the REST discount code
 * shape with the price rule embedded:
 * { id, code, price_rule_id, usage_count, created_at, updated_at, price_rule }.
 * @param {object} node DiscountCodeNode with codeDiscount
 * @param {object} [redeemCode] DiscountRedeemCode; null when it could not be read
 * @param {string} [code] the code string to fall back to without a redeem code
 * @returns {object}
 */
function toRestDiscountCode(node, redeemCode, code) {

    const priceRule = toRestPriceRule(node);
    return {
        'id': redeemCode ? client.fromGid(redeemCode.id) : null,
        'code': redeemCode ? redeemCode.code : (code || null),
        'price_rule_id': priceRule.id,
        'usage_count': redeemCode ? redeemCode.asyncUsageCount : null,
        'created_at': redeemCode ? redeemCode.createdAt : null,
        // A redeem code has no updatedAt of its own; the discount's is the closest.
        'updated_at': priceRule['updated_at'],
        'price_rule': priceRule
    };
}

// Shopify codes are case-insensitive.
function findRedeemCode(discount, code) {

    const wanted = String(code).toLowerCase();
    const candidates = [discount.matchingCodes, discount.codes]
        .reduce((all, connection) => all.concat((connection && connection.nodes) || []), []);
    return candidates.find(candidate => String(candidate.code).toLowerCase() === wanted) || null;
}

// Search syntax phrase: quote the code so spaces, colons or dashes are literal.
function codeSearchQuery(code) {

    return `"${String(code).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Build the DiscountCodeBasicInput from REST-like component parameters.
 * @param {object} params
 * @returns {object}
 */
function basicCodeInput(params) {

    const { code, title, valueType, amount, startsAt, endsAt, usageLimit, oncePerCustomer, minimumSubtotal } = params;
    const value = Math.abs(Number(amount));
    const input = {
        'title': title || code,
        'code': code,
        'startsAt': startsAt || new Date().toISOString(),
        'appliesOncePerCustomer': !!oncePerCustomer,
        'context': { 'all': 'ALL' },
        'customerGets': {
            'items': { 'all': true },
            'value': valueType === 'percentage'
                ? { 'percentage': Math.round(value * 1e4) / 1e6 }
                : { 'discountAmount': { 'amount': String(value), 'appliesOnEachItem': false } }
        }
    };
    if (endsAt) {
        input.endsAt = endsAt;
    }
    if (usageLimit) {
        input.usageLimit = Number(usageLimit);
    }
    if (minimumSubtotal !== undefined && minimumSubtotal !== null && minimumSubtotal !== '') {
        input.minimumRequirement = { 'subtotal': { 'greaterThanOrEqualToSubtotal': String(minimumSubtotal) } };
    }
    return input;
}

module.exports = (run) => ({

    /**
     * Create a basic code discount (amount off the whole order) with one code.
     * The terms and the code are created in one mutation, so a refused code
     * (e.g. a duplicate, 422) leaves nothing behind.
     * @param {object} params { code, title, valueType: 'percentage'|'fixed_amount', amount,
     *   startsAt, endsAt, usageLimit, oncePerCustomer, minimumSubtotal }
     * @returns {Promise<object>} REST discount code with `price_rule`
     */
    async createBasicCode(params) {

        const data = await run(CREATE_BASIC_CODE, { input: basicCodeInput(params) });
        const payload = client.checkUserErrors(data.discountCodeBasicCreate, 'discountCodeBasicCreate');
        const node = payload.codeDiscountNode;
        const codes = (node.codeDiscount.codes && node.codeDiscount.codes.nodes) || [];
        return toRestDiscountCode(node, codes[0] || null, params.code);
    },

    /**
     * Find a discount code by its code (case-insensitive).
     * @param {string} code
     * @returns {Promise<object|null>} REST discount code with `price_rule`, null when not found
     */
    async lookupCode(code) {

        const data = await run(LOOKUP_CODE, { code, codeQuery: codeSearchQuery(code) });
        const node = data.codeDiscountNodeByCode;
        if (!node) {
            return null;
        }
        return toRestDiscountCode(node, findRedeemCode(node.codeDiscount || {}, code), code);
    },

    /**
     * Delete a code discount together with all its codes.
     * @param {number|string} id discount node id (price_rule.id) or its gid
     * @returns {Promise<void>}
     */
    async deleteDiscount(id) {

        const data = await run(DELETE_CODE, { id: client.toGid('DiscountCodeNode', id) });
        client.checkUserErrors(data.discountCodeDelete, 'discountCodeDelete');
    }
});

module.exports.toRestPriceRule = toRestPriceRule;
module.exports.toRestDiscountCode = toRestDiscountCode;
module.exports.basicCodeInput = basicCodeInput;
