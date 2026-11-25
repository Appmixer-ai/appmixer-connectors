'use strict';

const lib = require('../../lib');

const EVENT_TYPES = ['com.qlik.v1.reload.finished'];

/**
 * The reload as the trigger emits it. The webhook payload only names the reload, so the reload is
 * read from the Reloads API: the output is the same shape as Get Reload, and a delivery naming a
 * reload the account cannot read is not emitted.
 * @param {object} context
 * @param {string} reloadId
 * @returns {Promise<object>}
 */
const fetchReload = async (context, reloadId) => {

    const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads/' + encodeURIComponent(reloadId) });
    return lib.mapReload(data);
};

const matches = (context, reload) => {

    const { appId, status } = context.properties;
    return (!appId || reload.appId === appId) && (!status || reload.status === status);
};

module.exports = {

    async start(context) {

        return lib.registerWebhook(context, { candidates: EVENT_TYPES, name: 'Reload Finished' });
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
            const data = event && event.data;
            if (data && data.id && matches(context, { appId: data.appId, status: data.status })) {
                let reload;
                try {
                    reload = await fetchReload(context, data.id);
                } catch (err) {
                    // The reload (or its app) was deleted before the delivery arrived: nothing to emit.
                    if (!lib.isNotFound(err)) {
                        throw err;
                    }
                    await context.log({ step: 'Ignoring a finished reload that no longer exists.', reloadId: data.id });
                }
                if (reload && matches(context, reload)) {
                    await context.sendJson(reload, 'out');
                }
            }
        } finally {
            await context.response();
        }
    },

    async test(context) {

        const { appId, status } = context.properties;
        if (!appId) {
            throw new context.CancelError('Select an App to get a recent reload as test data.');
        }
        const params = { appId, sort: '-creationTime', limit: 20 };
        if (status) {
            params.filter = 'status eq ' + JSON.stringify(status);
        }
        const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads', params });
        const finished = ((data && data.data) || []).find(item => lib.RELOAD_FINAL_STATUSES.includes(item.status));
        if (!finished) {
            throw new context.CancelError('The app has no finished reload to use as test data. Reload the app first.');
        }
        return context.sendJson(await fetchReload(context, finished.id), 'out');
    }
};
