'use strict';

const lib = require('../../lib');

// Posts created since the flow started, any status (queued, scheduled, draft, ...).
const POLL_OPTIONS = {
    buildFilter(windowStart) {

        return { createdAt: { start: windowStart.toISOString() } };
    },
    sortField: 'createdAt',
    timeFields: ['createdAt'],
    lookbackMs: 2 * 60 * 60 * 1000,
    // createdAt never predates the creation, so nothing before the flow start is needed.
    clampToSince: true
};

module.exports = {

    async start(context) {

        return lib.startPolling(context);
    },

    async tick(context) {

        const posts = await lib.pollPosts(context, POLL_OPTIONS);
        for (const post of posts) {
            await context.sendJson(post, 'out');
        }
    },

    // Flow Test Mode: the newest matching post, through the same request and mapping as tick().
    async test(context) {

        const { channelId } = context.properties;
        const organizationId = await lib.resolveTriggerOrganization(context);
        const filter = {};
        if (channelId) {
            filter.channelIds = [channelId];
        }
        const { posts } = await lib.fetchPostsPage(context, {
            organizationId,
            filter,
            sort: [{ field: 'createdAt', direction: 'desc' }],
            first: 1
        });
        if (!posts.length) {
            throw new context.CancelError('No post found to use as test data. Create a post in Buffer first.');
        }
        return context.sendJson(posts[0], 'out');
    }
};
