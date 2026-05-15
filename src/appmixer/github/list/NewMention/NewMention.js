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

        // Parse optional comma-separated repo filter — normalised to lowercase for case-insensitive matching
        const repoFilter = repositories
            ? new Set(repositories.split(',').map(r => r.trim().toLowerCase()).filter(Boolean))
            : null;

        // Use all=true so we also catch notifications that GitHub has already marked as read.
        // We track seen IDs ourselves via context.state, so read/unread doesn't matter here.
        const res = await lib.apiRequest(context, 'notifications?all=true&per_page=100');

        // Filter by reason=mention, and optionally by repository (case-insensitive)
        const mentions = res.data.filter(n => {
            if (n.reason !== 'mention') return false;
            if (repoFilter) {
                const fullName = (n.repository && n.repository.full_name || '').toLowerCase();
                if (!repoFilter.has(fullName)) return false;
            }
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
