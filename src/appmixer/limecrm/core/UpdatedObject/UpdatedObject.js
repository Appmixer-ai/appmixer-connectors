'use strict';

const lib = require('../../lib');

const EVENT = 'update';

// The output contract of one object when the limetype's properties are not known; the
// variables are generated from the limetype by GetObjectSchema.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' },
        originalValues: { type: 'object', title: 'Original Values', example: { phone: '+46 46 123 455' } }
    }
};

module.exports = {

    ITEM_SCHEMA,

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
            const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
            if (body.id !== undefined && body.id !== null) {
                let object;
                try {
                    // The object is read through the API so the output is the same as Get Object's.
                    object = await lib.getObject(context, limetype, body.id);
                } catch (err) {
                    if (!lib.isNotFound(err)) throw err;
                    await context.log({ step: 'The updated object could not be read.', id: body.id });
                }
                if (object) {
                    await context.sendJson({ ...object, originalValues: body.original_values || {} }, 'out');
                }
            }
            return context.response();
        }
    },

    async test(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        const [object] = await lib.latestObjects(context, limetype, '_timestamp', 1);
        if (!object) {
            throw new context.CancelError('There are no objects of this limetype yet. Create one in Lime CRM to get test data.');
        }
        // The previous values exist only in a real update event.
        return context.sendJson({ ...object, originalValues: {} }, 'out');
    }
};
