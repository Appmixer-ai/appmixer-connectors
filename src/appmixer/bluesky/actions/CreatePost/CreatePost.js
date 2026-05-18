'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { text, langs, replyUri } = context.messages.in.content;

        if (!text) {
            throw new context.CancelError('Text is required!');
        }

        if (text.length > 300) {
            throw new context.CancelError('Text must be 300 characters or fewer.');
        }

        const facets = await lib.buildFacets(context, text);

        const record = {
            $type: 'app.bsky.feed.post',
            text,
            createdAt: new Date().toISOString()
        };

        if (langs) {
            record.langs = langs.split(',').map(l => l.trim()).filter(Boolean);
        }

        if (facets) {
            record.facets = facets;
        }

        if (replyUri) {
            // Fetch the root post to build a proper reply reference
            const postsResponse = await lib.xrpc(context, {
                method: 'GET',
                nsid: 'app.bsky.feed.getPosts',
                params: { uris: [replyUri] }
            });
            const replyPost = postsResponse.posts && postsResponse.posts[0];
            if (!replyPost) {
                throw new context.CancelError('Could not find the post to reply to.');
            }

            // Determine root: if the reply target itself has a reply, use its root; otherwise it IS the root
            const root = (replyPost.record && replyPost.record.reply)
                ? replyPost.record.reply.root
                : { uri: replyPost.uri, cid: replyPost.cid };

            record.reply = {
                root,
                parent: { uri: replyPost.uri, cid: replyPost.cid }
            };
        }

        const result = await lib.xrpc(context, {
            method: 'POST',
            nsid: 'com.atproto.repo.createRecord',
            data: {
                repo: context.auth.handle,
                collection: 'app.bsky.feed.post',
                record
            }
        });

        return context.sendJson(result, 'out');
    }
};
