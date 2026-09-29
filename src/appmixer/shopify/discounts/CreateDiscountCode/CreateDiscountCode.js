'use strict';
const commons = require('../../lib');

// Unambiguous alphabet — no I/O/0/1 — so a generated code survives being read
// off a screen or dictated over the phone.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const GENERATED_CODE_LENGTH = 8;

// Shopify has no "generate a code for me" endpoint: the code string is always
// supplied by the caller, so build one when the user left the field empty.
function generateCode() {

    let code = '';
    for (let i = 0; i < GENERATED_CODE_LENGTH; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
}

/**
 * Generate a discount code together with the price rule holding its terms.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const {
            valueType,
            value,
            code,
            title,
            prerequisiteSubtotalRange,
            startsAt,
            endsAt,
            usageLimit,
            oncePerCustomer
        } = context.messages.in.content;

        if (!valueType) {
            throw new context.CancelError('Discount Type is required!');
        }
        if (value === undefined || value === null || value === '') {
            throw new context.CancelError('Discount Value is required!');
        }

        // The UI asks for a positive number; the API expects the discount as a
        // negative value.
        const amount = Math.abs(Number(value));
        if (!Number.isFinite(amount) || amount === 0) {
            throw new context.CancelError('Discount Value must be a non-zero number!');
        }
        if (valueType === 'percentage' && amount > 100) {
            throw new context.CancelError('A percentage discount cannot be greater than 100!');
        }

        const discountCode = code ? String(code).trim() : generateCode();

        const priceRulePayload = {
            'title': title || discountCode,
            'value_type': valueType,
            'value': String(-amount),
            'target_type': 'line_item',
            'target_selection': 'all',
            'allocation_method': 'across',
            'customer_selection': 'all',
            'starts_at': startsAt || new Date().toISOString(),
            'once_per_customer': !!oncePerCustomer
        };

        if (endsAt) {
            priceRulePayload['ends_at'] = endsAt;
        }
        if (usageLimit) {
            priceRulePayload['usage_limit'] = Number(usageLimit);
        }
        if (prerequisiteSubtotalRange) {
            priceRulePayload['prerequisite_subtotal_range'] = {
                'greater_than_or_equal_to': String(prerequisiteSubtotalRange)
            };
        }

        const shopify = commons.getShopifyAPI(context);
        const priceRule = await shopify.priceRule.create(priceRulePayload);

        let created;
        try {
            created = await shopify.discountCode.create(priceRule.id, { code: discountCode });
        } catch (error) {
            // The code was refused (typically a duplicate): a price rule without
            // a code is useless, so do not leave it behind in the store.
            await shopify.priceRule.delete(priceRule.id).catch(() => {});
            throw error;
        }

        return context.sendJson({ ...created, 'price_rule': priceRule }, 'out');
    }
};
