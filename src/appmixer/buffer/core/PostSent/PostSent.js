'use strict';

const lib = require('../../lib');

// Posts Buffer published since the flow started. startDate matches posts created or due after
// the window start; the window reaches back 24 hours because a post can be published well
// after it was due (paused queue, retries). Only posts sent after the flow start fire.
const POLL_OPTIONS = {
    buildFilter(windowStart) {

        return { status: ['sent'], startDate: windowStart.toISOString() };
    },
    sortField: 'dueAt',
    timeFields: ['sentAt', 'dueAt'],
    lookbackMs: 24 * 60 * 60 * 1000,
    clampToSince: false
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
        filter.status = ['sent'];
        const { posts } = await lib.fetchPostsPage(context, {
            organizationId,
            filter,
            sort: [{ field: 'dueAt', direction: 'desc' }],
            first: 1
        });
        if (!posts.length) {
            throw new context.CancelError('No sent post found to use as test data. Publish a post through Buffer first.');
        }
        return context.sendJson(posts[0], 'out');
    }
};
