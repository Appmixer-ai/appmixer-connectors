'use strict';

const lib = require('../../lib');

const EVENT = 'delete';

module.exports = {

    async start(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        return lib.startWebhookTrigger(context, limetype + '.' + EVENT);
    },

    async stop(context) {

        return lib.stopWebhookTrigger(context);
    },

    async receive(context) {

        if (context.messages.webhook) {
            const { accepted, status, body } = await lib.readWebhook(context);
            if (!accepted) {
                return status ? context.response({ error: 'Invalid signature.' }, status) : context.response();
            }
            if (body.id !== undefined && body.id !== null) {
                await context.sendJson({
                    id: body.id,
                    limetype: body.limetype || context.properties.limetype,
                    values: body.values || {}
                }, 'out');
            }
            return context.response();
        }
    },

    async test(context) {

        // Lime CRM has no API that lists deleted objects, so there is no real example.
        throw new context.CancelError('Deleted objects cannot be read from Lime CRM. Delete an object of this limetype while the flow runs to see the output.');
    }
};
