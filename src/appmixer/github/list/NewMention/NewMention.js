'use strict';
const lib = require('../../lib');

/**
 * Component which triggers whenever the authenticated user is mentioned on GitHub.
 * Uses the GitHub Notifications API filtering by reason=mention.
 * @extends {Component}
 */
module.exports = {

    async tick(context) {

        const res = await lib.apiRequest(context, 'notifications?all=false&per_page=100');

        // Filter notifications where reason is "mention"
        const mentions = res.data.filter(n => n.reason === 'mention');

        let known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, mentions, 'id');

        if (diff.length) {
            await Promise.all(diff.map(notification => context.sendJson(notification, 'out')));
        }
        await context.saveState({ known: actual });
    }
};
