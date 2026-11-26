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
            const { accepted, unverifiable, status, body } = await lib.readWebhook(context);
            if (unverifiable) {
                // New and Updated Object read the changes through the API instead; deleted objects
                // cannot be listed, so this event is lost.
                await context.log({ step: 'The deleted object of an unverifiable delivery cannot be recovered: Lime CRM has no API that lists deleted objects.' });
                return context.response({}, status);
            }
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
