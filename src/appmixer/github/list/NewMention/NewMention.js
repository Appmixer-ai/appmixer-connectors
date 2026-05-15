'use strict';
const lib = require('../../lib');

/**
 * Component which triggers whenever the authenticated user is mentioned on GitHub.
 * Uses the GitHub Notifications API filtering by reason=mention.
 * @extends {Component}
 */
module.exports = {

    async start(context) {
        // Record the flow start time so the first tick only picks up mentions
        // that arrive AFTER the flow was started.
        if (!context.state.since) {
            await context.saveState({ since: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), known: [] });
        }
    },

    async tick(context) {

        const { repositories } = context.properties;

        // Parse optional comma-separated repo filter — normalised to lowercase for case-insensitive matching
        const repoFilter = repositories
            ? new Set(repositories.split(',').map(r => r.trim().toLowerCase()).filter(Boolean))
            : null;

        // since — server-side date filter: only notifications updated after the flow started.
        // GitHub expects YYYY-MM-DDTHH:MM:SSZ (no milliseconds).
        const since = encodeURIComponent(context.state.since);
        const res = await lib.apiRequest(context, `notifications?all=true&since=${since}&per_page=100`);

        // Client-side: keep only reason=mention and apply optional repo filter (case-insensitive).
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

        // Advance the since window to now so the next tick only fetches what's new.
        await context.saveState({ known: actual, since: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') });
    }
};
