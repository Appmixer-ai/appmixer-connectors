'use strict';
const lib = require('../../lib');

/**
 * Component which triggers whenever a new issue is assigned to the authenticated user.
 * @extends {Component}
 */
/**
 * Maximum number of IDs to retain in context.state.known.
 * getNewItems() replaces (not accumulates) known each tick, so this cap only
 * fires if a single tick returns an unusually large page of results.
 */
const MAX_KNOWN = 500;

module.exports = {

    async tick(context) {

        const { repositoryId } = context.properties;

        let endpoint;
        if (repositoryId) {
            // Repo-specific: GET /repos/{owner}/{repo}/issues?assignee=@me&state=open
            endpoint = `repos/${repositoryId}/issues?assignee=@me&state=open&per_page=100`;
        } else {
            // Cross-repo: GET /issues?filter=assigned (returns all issues assigned to the auth user)
            endpoint = 'issues?filter=assigned&state=open&per_page=100';
        }

        const res = await lib.apiRequest(context, endpoint);

        let known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const { diff, actual } = lib.getNewItems(known, res.data, 'id');

        if (diff.length) {
            await Promise.all(diff.map(issue => context.sendJson(issue, 'out')));
        }
        const trimmedKnown = actual.length > MAX_KNOWN ? actual.slice(actual.length - MAX_KNOWN) : actual;
        await context.saveState({ known: trimmedKnown });
    }
};
