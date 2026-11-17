'use strict';

const lib = require('../../lib');

const EVENT_TYPES = ['com.qlik.v1.app.deleted', 'com.qlik.app.deleted'];

/**
 * The deleted app from the event. A deleted app cannot be read back from the API, so the event
 * itself is the source; the delivery is accepted only with the token of this registration.
 * @param {object} event
 * @returns {object}
 */
const toDeletedApp = (event) => {

    const data = event.data || {};
    return {
        id: data.id || event.toplevelresourceid,
        name: data.name,
        spaceId: data.spaceId || event.spaceid,
        usage: data.usage,
        deleteType: data.deleteType,
        deletedAt: event.time,
        deletedBy: event.userid
    };
};

module.exports = {

    async start(context) {

        return lib.registerWebhook(context, { candidates: EVENT_TYPES, name: 'App Deleted' });
    },

    async stop(context) {

        return lib.unregisterWebhook(context);
    },

    async receive(context) {

        if (!context.messages.webhook) {
            return;
        }
        try {
            const event = await lib.readWebhookEvent(context);
            if (event) {
                const app = toDeletedApp(event);
                const { spaceId } = context.properties;
                if (app.id && (!spaceId || app.spaceId === spaceId)) {
                    await context.sendJson(app, 'out');
                }
            }
        } finally {
            await context.response();
        }
    },

    async test(context) {

        // Qlik Cloud has no API that lists deleted apps, so there is no real example to emit.
        throw new context.CancelError('App Deleted has no test data: Qlik Cloud cannot list deleted apps. '
            + 'Start the flow and delete an app to trigger it.');
    }
};
