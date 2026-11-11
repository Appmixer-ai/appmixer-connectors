'use strict';

const lib = require('../../lib');

module.exports = {

    // https://loops.so/docs/api-reference/send-transactional-email
    async receive(context) {

        const {
            transactionalId,
            email,
            addToAudience,
            dataVariables,
            idempotencyKey
        } = context.messages.in.content;

        if (!transactionalId) {
            throw new context.CancelError('Transactional Email is required!');
        }
        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const data = { transactionalId, email };
        if (typeof addToAudience === 'boolean') {
            data.addToAudience = addToAudience;
        }
        const variables = lib.parseJsonInput(context, dataVariables, 'Data Variables', { object: true });
        if (variables) {
            data.dataVariables = variables;
        }

        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        const { data: response } = await lib.request(context, {
            method: 'POST',
            path: '/v1/transactional',
            data,
            headers
        });

        return context.sendJson({ success: response.success, transactionalId, email }, 'out');
    }
};
