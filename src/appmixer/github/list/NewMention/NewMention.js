'use strict';
const lib = require('../../lib');

/**
 * Component which triggers whenever the authenticated user is mentioned on GitHub.
 * Uses the GitHub Notifications API filtering by reason=mention.
 * @extends {Component}
 */
module.exports = {

    async tick(context) {

        const { repositories } = context.properties;

        // Parse optional comma-separated repo filter into a Set for O(1) lookups
        const repoFilter = repositories
            ? new Set(repositories.split(',').map(r => r.trim()).filter(Boolean))
            : null;

        const res = await lib.apiRequest(context, 'notifications?all=false&per_page=100');

        // Filter by reason=mention, and optionally by repository
        const mentions = res.data.filter(n => {
            if (n.reason !== 'mention') return false;
            if (repoFilter && !repoFilter.has(n.repository && n.repository.full_name)) return false;
            return true;
        });

        let known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, mentions, 'id');

        if (diff.length) {
            await Promise.all(diff.map(notification => context.sendJson(notification, 'out')));
        }
        await context.saveState({ known: actual });
    }
};
