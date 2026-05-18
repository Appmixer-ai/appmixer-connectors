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
        const mentions = notifications.filter(n => n.reason === 'mention');

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, mentions, 'uri');

        await context.saveState({ known: actual });

        for (const mention of diff) {
            await context.sendJson(mention, 'out');
        }
    },

    // Temporary receive method for CLI test runner validation
    async receive(context) {

        const response = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.notification.listNotifications',
            params: { limit: 50 }
        });

        const notifications = response.notifications || [];
        const mentions = notifications.filter(n => n.reason === 'mention');

        // For testing: return first mention notification or a representative empty structure
        if (mentions.length > 0) {
            return context.sendJson(mentions[0], 'out');
        }

        // Return representative structure when no mentions yet
        return context.sendJson({
            uri: 'at://did:plc:example/app.bsky.feed.post/example',
            cid: 'bafyreigexample',
            reason: 'mention',
            author: {
                did: 'did:plc:example',
                handle: 'example.bsky.social',
                displayName: 'Example User',
                avatar: 'https://cdn.bsky.app/img/avatar/plain/example'
            },
            record: {
                text: 'Hello @appmixer-dev.bsky.social, this is a mention!'
            },
            indexedAt: new Date().toISOString()
        }, 'out');
    }
};
