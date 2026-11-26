'use strict';

const lib = require('../../lib');

const EVENT = 'new';

// The output contract of one object when the limetype's properties are not known; the
// variables are generated from the limetype by GetObjectSchema.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'ID', example: 1001 },
        _createdtime: { type: 'string', format: 'date-time', title: 'Created Time', example: '2026-11-16T09:30:00+01:00' },
        _timestamp: { type: 'string', format: 'date-time', title: 'Updated Time', example: '2026-11-16T10:15:00+01:00' }
    }
};

async function emit(context, object) {

    if (await lib.markEmitted(context, 'new-' + object.id)) {
        await context.sendJson(object, 'out');
    }
}

/**
 * Polling mode: the objects created since the last check (keyset on id).
 */
async function poll(context, limetype) {

    await lib.updateState(context, async state => {
        if (state.cursorId === undefined) {
            return lib.newObjectsBaseline(context, limetype);
        }
        const previous = Number(state.cursorId) || 0;
        const { objects, cursorId, complete } = await lib.pollNewObjects(context, limetype, previous);
        if (!complete) {
            await context.log({
                step: 'More objects were created since the last check than one check reads; only the newest are emitted.',
                count: objects.length
            });
        }
        for (const object of objects) {
            await context.sendJson(object, 'out');
        }
        return cursorId !== state.cursorId ? { ...state, cursorId } : null;
    });
}

/**
 * Webhook mode: a delivery could not be verified, read the objects created around it.
 */
async function catchUp(context, limetype) {

    await lib.updateState(context, async state => {
        const since = state.catchUpSince;
        if (!since) return null;
        const { objects, complete } = await lib.objectsSince(context, limetype, 'id', '_createdtime', since);
        if (!complete) {
            await context.log({ step: 'The catch-up after an unverifiable delivery found more objects than one check reads; only the newest are emitted.' });
        }
        for (const object of objects) {
            await emit(context, object);
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
            return context.saveState(await lib.newObjectsBaseline(context, limetype));
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
                    // Deleted (or not visible to the API user) before it could be read.
                    if (!lib.isNotFound(err)) throw err;
                    await context.log({ step: 'The new object could not be read.', id: body.id });
                }
                if (object) {
                    await emit(context, object);
                }
            }
            return context.response();
        }
    },

    async test(context) {

        const limetype = lib.assertName(context, context.properties.limetype, 'Limetype');
        const [object] = await lib.latestObjects(context, limetype, 'id', 1);
        if (!object) {
            throw new context.CancelError('There are no objects of this limetype yet. Create one in Lime CRM to get test data.');
        }
        return context.sendJson(object, 'out');
    }
};
