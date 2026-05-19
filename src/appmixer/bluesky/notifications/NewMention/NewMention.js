'use strict';

const lib = require('../../lib');

module.exports = {

    async tick(context) {

        let allNotifications = [];
        let cursor;
        do {
            const response = await lib.xrpc(context, {
                method: 'GET',
                nsid: 'app.bsky.notification.listNotifications',
                params: Object.assign({ limit: 100 }, cursor ? { cursor } : {})
            });
            const batch = response.notifications || [];
            allNotifications = allNotifications.concat(batch);
            cursor = response.cursor;
            if (!cursor || batch.length === 0) break;
        } while (cursor);

        const mentions = allNotifications.filter(n => n.reason === 'mention');

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, mentions, 'uri');

        for (const mention of diff) {
            await context.sendJson(mention, 'out');
        }
        await context.saveState({ known: actual });
    }
};
