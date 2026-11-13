'use strict';

const lib = require('../../lib');

/**
 * Convert the typed value to what Manychat expects for the field type:
 * a number for Number, a boolean for True/False, a string otherwise.
 * @param {object} context
 * @param {string} type Manychat field type (text, number, date, datetime, boolean) or undefined
 * @param {*} value input value
 * @returns {*}
 */
const convertValue = function(context, type, value) {

    if (type === 'number') {
        if (typeof value === 'number') return value;
        const number = Number(String(value).trim());
        if (String(value).trim() === '' || Number.isNaN(number)) {
            throw new context.CancelError(`Value must be a number for this custom field, got "${value}".`);
        }
        return number;
    }
    if (type === 'boolean') {
        if (typeof value === 'boolean') return value;
        const text = String(value).trim().toLowerCase();
        if (text === 'true') return true;
        if (text === 'false') return false;
        throw new context.CancelError(`Value must be true or false for this custom field, got "${value}".`);
    }
    return typeof value === 'string' ? value : String(value);
};

module.exports = {

    convertValue,

    async receive(context) {

        const { subscriberId, fieldId, fieldValue } = context.messages.in.content;

        if (!subscriberId) {
            throw new context.CancelError('Subscriber ID is required!');
        }
        if (!fieldId) {
            throw new context.CancelError('Custom Field is required!');
        }
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            throw new context.CancelError('Value is required!');
        }

        const id = lib.toApiId(context, fieldId, 'Custom Field');

        // The value has to be sent in the field's own type, so look the type up (cached).
        const fields = await lib.requestCached(context, '/fb/page/getCustomFields') || [];
        const field = fields.find(item => String(item.id) === String(id));

        await lib.request(context, {
            method: 'POST',
            path: '/fb/subscriber/setCustomField',
            data: {
                subscriber_id: lib.toApiId(context, subscriberId, 'Subscriber ID'),
                field_id: id,
                field_value: convertValue(context, field && field.type, fieldValue)
            }
        });

        return context.sendJson({
            subscriberId: String(subscriberId),
            fieldId: String(fieldId),
            fieldValue: String(fieldValue)
        }, 'out');
    }
};
