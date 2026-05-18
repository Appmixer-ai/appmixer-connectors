'use strict';

const lib = require('../../lib');

module.exports = {

    async tick(context) {

        const response = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.notification.listNotifications',
            params: { limit: 50 }
        });

        const notifications = response.notifications || [];
        const replies = notifications.filter(n => n.reason === 'reply');

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, replies, 'uri');

        await context.saveState({ known: actual });

        for (const reply of diff) {
            await context.sendJson(reply, 'out');
        }
    }
};
