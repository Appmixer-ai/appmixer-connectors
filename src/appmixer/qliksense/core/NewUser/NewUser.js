'use strict';

const lib = require('../../lib');

const EVENT_TYPES = ['com.qlik.v1.user.created'];

const fetchUser = async (context, userId) => {

    const { data } = await lib.apiRequest(context, { path: '/api/v1/users/' + encodeURIComponent(userId) });
    return lib.mapUser(data);
};

module.exports = {

    async start(context) {

        return lib.registerWebhook(context, { candidates: EVENT_TYPES, name: 'New User' });
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
            const userId = event && event.data && event.data.id;
            if (userId) {
                // Read the user back: the output matches Get User, and an unknown ID is not emitted.
                await context.sendJson(await fetchUser(context, userId), 'out');
            }
        } finally {
            await context.response();
        }
    },

    async test(context) {

        const { data } = await lib.apiRequest(context, { path: '/api/v1/users', params: { sort: '-createdAt', limit: 1 } });
        const user = ((data && data.data) || [])[0];
        if (!user) {
            throw new context.CancelError('No user to use as test data.');
        }
        return context.sendJson(await fetchUser(context, user.id), 'out');
    }
};
