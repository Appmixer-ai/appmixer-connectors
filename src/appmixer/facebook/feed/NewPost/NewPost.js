'use strict';

const { FacebookClient } = require('../../lib');

/**
 * Component which triggers whenever new post is created on the user's feed.
 */
module.exports = {

    async tick(context) {

        const client = new FacebookClient(context);
        const since = Math.floor(Date.now() / 1000);

        const posts = await client.fetchAll('/me/feed', {
            since: context.state.since || since,
            fields: 'id,message,story,created_time'
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
            await context.sendJson(post, 'post');
        }

        await context.saveState({ known: Array.from(actual), since });
    }
};
