'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { postUri } = context.messages.in.content;

        if (!postUri) {
            throw new context.CancelError('Post URI is required!');
        }

        // Fetch the post to get its CID
        const postsResponse = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.feed.getPosts',
            params: { uris: [postUri] }
        });

        const post = postsResponse.posts && postsResponse.posts[0];
        if (!post) {
            throw new context.CancelError('Could not find the post to like.');
        }

        const result = await lib.xrpc(context, {
            method: 'POST',
            nsid: 'com.atproto.repo.createRecord',
            data: {
                repo: context.auth.handle,
                collection: 'app.bsky.feed.like',
                record: {
                    $type: 'app.bsky.feed.like',
                    subject: {
                        uri: post.uri,
                        cid: post.cid
                    },
                    createdAt: new Date().toISOString()
                }
            }
        });

        return context.sendJson(result, 'out');
    }
};
