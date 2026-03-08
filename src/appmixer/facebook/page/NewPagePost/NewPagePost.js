'use strict';

const { FacebookClient } = require('../../lib');

/**
 * Trigger that fires whenever a new post is created on a page.
 */
module.exports = {

    async tick(context) {

        const client = new FacebookClient(context);
        const { pageId } = context.properties;
        const since = Math.floor(Date.now() / 1000);

        // Get page access token and name
        const pageDetails = await client.get(`/${pageId}`, { fields: 'access_token,name' });
        client.setAccessToken(pageDetails.access_token);

        const posts = await client.fetchAll(`/${pageId}/feed`, {
            since: context.state.since || since,
            fields: 'id,message,created_time'
        });

        const known = Array.isArray(context.state.known) ? new Set(context.state.known) : null;
        const actual = new Set();
        const diff = [];

        for (const post of posts) {
            if (known && !known.has(post.id)) {
                diff.push(post);
            }
            actual.add(post.id);
        }

        for (const post of diff) {
            await context.sendJson({
                ...post,
                pageName: pageDetails.name,
                pageId
            }, 'post');
        }

        await context.saveState({ known: Array.from(actual), since });
    }
};
