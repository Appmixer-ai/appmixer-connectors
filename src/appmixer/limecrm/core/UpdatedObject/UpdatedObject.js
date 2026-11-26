/* eslint-disable no-underscore-dangle */
// Lime CRM's system properties use underscore names (_timestamp, _createdtime).
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

async function emit(context, object, originalValues, previousKnown, { dedupe = true } = {}) {

    if (!lib.conditionMet(context.properties, object, originalValues, previousKnown)) {
        return;
    }
    if (dedupe && !await lib.markEmitted(context, 'update-' + object.id + '-' + object._timestamp)) {
        return;
    }
    await context.sendJson({ ...object, originalValues }, 'out');
}

/**
 * Polling mode: the objects updated since the last check, with the previous values of the
 * changed properties from the values the trigger saw last time.
 */
async function poll(context, limetype) {

    await lib.updateState(context, async state => {
        if (state.cursor === undefined) {
            return lib.updatedObjectsBaseline(context, limetype);
        }
        const { updates, complete, state: next } = await lib.pollUpdatedObjects(context, limetype, state);
        if (!complete) {
            await context.log({ step: 'More objects were updated since the last check than one check reads; only the newest are emitted.', count: updates.length });
        }
        for (const { object, originalValues, previousKnown } of updates) {
            await emit(context, object, originalValues, previousKnown, { dedupe: false });
        }
        return next;
    });
}

/**
 * Webhook mode: a delivery could not be verified, read the objects updated around it. Their
 * previous values are not known (only the delivery had them).
 */
async function catchUp(context, limetype) {

    await lib.updateState(context, async state => {
        const since = state.catchUpSince;
        if (!since) return null;
        const { objects, complete } = await lib.objectsSince(context, limetype, '_timestamp', '_timestamp', since);
        if (!complete) {
            await context.log({ step: 'The catch-up after an unverifiable delivery found more objects than one check reads; only the newest are emitted.' });
        }
        for (const object of objects) {
            if (lib.isCreation(object)) continue;
            await emit(context, object, {}, false);
        }
        const next = { ...state };
        delete next.catchUpSince;
        return next;
    });
}

module.exports = {

    ITEM_SCHEMA,

    async start(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        if (lib.triggerMode(context) === 'polling') {
            return context.saveState(await lib.updatedObjectsBaseline(context, limetype));
        }
        return lib.startWebhookTrigger(context, limetype + '.' + EVENT);
    },

    async stop(context) {

        return lib.stopWebhookTrigger(context);
    },

    async tick(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        if (lib.triggerMode(context) === 'polling') {
            return poll(context, limetype);
        }
        // Webhook mode makes no request unless a delivery could not be verified.
        const state = await context.loadState() || {};
        if (state.catchUpSince) {
            return catchUp(context, limetype);
        }
    },

    async receive(context) {

        if (context.messages.webhook) {
            const { accepted, unverifiable, status, body, deliveryTime } = await lib.readWebhook(context);
            if (unverifiable) {
                await lib.requestCatchUp(context, deliveryTime);
                return context.response({}, status);
            }
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
                    await emit(context, object, body.original_values || {}, true);
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
