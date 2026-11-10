'use strict';

const lib = require('../../lib');

const TYPES = ['string', 'number', 'boolean', 'date'];

module.exports = {

    // https://loops.so/docs/api-reference/create-contact-property
    async receive(context) {

        const { name, type } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }
        if (!type) {
            throw new context.CancelError('Type is required!');
        }
        if (!TYPES.includes(type)) {
            throw new context.CancelError(`Type must be one of: ${TYPES.join(', ')}.`);
        }

        await lib.request(context, {
            method: 'POST',
            path: '/v1/contacts/properties',
            data: { name, type }
        });

        // Loops answers { success: true } only; the property is addressed by its name (the key).
        return context.sendJson({ key: name, type }, 'out');
    }
};
