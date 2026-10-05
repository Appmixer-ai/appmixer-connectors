'use strict';
const lib = require('../../lib');

/**
 * Maximum number of IDs to retain in context.state.known. A tick normally stores one
 * page of results; more only when over a page of issues was created since the last tick.
 */
const MAX_KNOWN = 500;

// lib.apiRequest() always asks for 100 results per page.
const PAGE_SIZE = 100;

// The search API serves at most 1000 results per query.
const MAX_PAGES = 10;

/**
 * Search query matching the issues the trigger is configured to watch.
 * @param {Object} context
 * @returns {string}
 */
function buildQuery(context) {

    const { repositoryId, includePr = false, state = 'all', labels = [] } = context.properties;

    // Normalize multiselect fields
    const normalizedLabels = labels ? lib.normalizeMultiselectInput(labels, context, 'Labels') : [];

    return [
        `repo:${repositoryId}`,
        normalizedLabels.length ? `label:${normalizedLabels.map(label => `"${label}"`).join(',')}` : '',
        state !== 'all' ? `state:${state}` : '',
        !includePr ? 'is:issue' : ''
    ].filter(Boolean).join('+');
}

/**
 * Creation time at or below which an unseen issue is not new.
 *
 * Only the newest issues are read on a tick. When the matching issues do not fit on what
 * was read, the previous tick stores the creation time of the oldest one it saw. An issue
 * at or below that time was not created since: it moved up because a newer issue left the
 * results (it was closed, or lost the label).
 *
 * @param {Object} state component state saved by the previous tick
 * @param {Set} known IDs seen on the previous tick
 * @param {Array<Object>} issues first page of the current results, newest first
 * @param {number} total number of issues matching the query
 * @returns {?string} ISO timestamp, or null when every unseen issue is new
 */
function getFloor(state, known, issues, total) {

    if (state.floor !== undefined) {
        return state.floor;
    }

    // State saved by a version that stored no floor. If everything fits on the page, the
    // page it read was complete too.
    if (!issues.length || !(total > issues.length)) {
        return null;
    }
    // Otherwise take the newest stored issue as the floor, so that only issues created
    // after it fire; when none is on the page, start over from this tick.
    const newestKnown = issues.find(issue => known.has(issue.id)) || issues[0];
    return newestKnown.created_at;
}

/**
 * Component which triggers whenever new issue is created.
 * @extends {Component}
 */
module.exports = {

    async tick(context) {

        const query = buildQuery(context);
        const fetchPage = async page => {
            // Newest first, asked for explicitly: the default order is best match.
            const { data } = await lib.apiRequest(context, `search/issues?q=${query}`, {
                params: { sort: 'created', order: 'desc', page }
            });
            return data;
        };

        const firstPage = await fetchPage(1);
        const total = firstPage.total_count;
        let issues = firstPage.items;
        let newIssues = [];

        if (Array.isArray(context.state.known)) {
            const known = new Set(context.state.known);
            const floor = getFloor(context.state, known, issues, total);
            const isNew = issue => !known.has(issue.id) && (!floor || issue.created_at > floor);

            // A whole page of new issues means there may be more of them on the next one.
            for (let page = 2; page <= MAX_PAGES; page++) {
                const lastPage = issues.slice((page - 2) * PAGE_SIZE);
                if (lastPage.length < PAGE_SIZE || !lastPage.every(isNew)) {
                    break;
                }
                issues = issues.concat((await fetchPage(page)).items);
            }

            // Oldest first, the order they were created in.
            newIssues = issues.filter(isNew).reverse();
        }

        if (newIssues.length) {
            await Promise.all(newIssues.map(issue => {
                return context.sendJson(issue, 'issue');
            }));
        }

        const seen = issues.slice(0, MAX_KNOWN);
        await context.saveState({
            known: seen.map(issue => issue.id),
            floor: seen.length && total > seen.length ? seen[seen.length - 1].created_at : null
        });
    },

    async test(context) {

        // The same query as tick(), honoring the configured filters.
        const query = buildQuery(context);

        const issue = await lib.fetchLatest(context, `search/issues?q=${query}`, {
            params: { sort: 'created', order: 'desc' }
        });
        if (!issue) {
            throw new Error('No recent issues to use as test data.');
        }
        return context.sendJson(issue, 'issue');
    }
};
