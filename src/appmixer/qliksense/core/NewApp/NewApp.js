'use strict';

const lib = require('../../lib');

// Qlik lists app events as com.qlik.v1.app.created on newer tenants and com.qlik.app.created on
// older ones; the tenant's own event-type list decides.
const EVENT_TYPES = ['com.qlik.v1.app.created', 'com.qlik.app.created'];

/**
 * The app as the trigger emits it: read from the Apps API (same shape as Get App), with the space
 * of the event when the app attributes do not carry one.
 * @param {object} context
 * @param {string} appId
 * @param {string} [spaceId]
 * @returns {Promise<object>}
 */
const fetchApp = async (context, appId, spaceId) => {

    const { data } = await lib.apiRequest(context, { path: '/api/v1/apps/' + encodeURIComponent(appId) });
    const app = lib.mapApp(data);
    if (!app.spaceId && spaceId) {
        app.spaceId = spaceId;
    }
    return app;
};

module.exports = {

    async start(context) {

        return lib.registerWebhook(context, { candidates: EVENT_TYPES, name: 'New App' });
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
            if (!event) {
                return;
            }
            const { id: appId, spaceId: eventSpaceId } = lib.appFromEvent(event);
            if (!appId) {
                await context.log({ step: 'Ignoring an app event without an app ID.', event });
                return;
            }
            const { spaceId } = context.properties;
            if (!spaceId || eventSpaceId === spaceId) {
                let app;
                try {
                    app = await fetchApp(context, appId, eventSpaceId);
                } catch (err) {
                    // Deleted again before the delivery arrived: nothing to emit.
                    if (!lib.isNotFound(err)) {
                        throw err;
                    }
                }
                if (app) {
                    await context.sendJson(app, 'out');
                }
            }
        } finally {
            await context.response();
        }
    },

    async test(context) {

        const { spaceId } = context.properties;
        const params = { resourceType: 'app', sort: '-createdAt', limit: 1, noActions: true };
        if (spaceId) {
            params.spaceId = spaceId;
        }
        const { data } = await lib.apiRequest(context, { path: '/api/v1/items', params });
        const item = ((data && data.data) || [])[0];
        if (!item) {
            throw new context.CancelError('No app to use as test data. Create an app first.');
        }
        return context.sendJson(await fetchApp(context, item.resourceId, item.spaceId), 'out');
    }
};
