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
        const follows = notifications.filter(n => n.reason === 'follow');

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, follows, 'uri');

        await context.saveState({ known: actual });

        for (const follow of diff) {
            await context.sendJson(follow, 'out');
        }
    }
};
