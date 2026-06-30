'use strict';

const lib = require('../../lib');

const schema = {
    'uri': { 'type': 'string', 'title': 'Post URI' },
    'cid': { 'type': 'string', 'title': 'Post CID' },
    'text': { 'type': 'string', 'title': 'Post Text' },
    'authorDid': { 'type': 'string', 'title': 'Author DID' },
    'authorHandle': { 'type': 'string', 'title': 'Author Handle' },
    'authorDisplayName': { 'type': 'string', 'title': 'Author Display Name' },
    'likeCount': { 'type': 'integer', 'title': 'Like Count' },
    'repostCount': { 'type': 'integer', 'title': 'Repost Count' },
    'replyCount': { 'type': 'integer', 'title': 'Reply Count' },
    'indexedAt': { 'type': 'string', 'title': 'Indexed At' }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Posts', value: 'posts' });
        }

        const response = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.feed.getTimeline',
            params: { limit: 50 }
        });

        const feedItems = response.feed || [];

        // Normalize: extract post data from feed view
        const records = feedItems.map(item => {
            const post = item.post || {};
            return {
                uri: post.uri,
                cid: post.cid,
                text: post.record && post.record.text,
                authorDid: post.author && post.author.did,
                authorHandle: post.author && post.author.handle,
                authorDisplayName: post.author && post.author.displayName,
                likeCount: post.likeCount,
                repostCount: post.repostCount,
                replyCount: post.replyCount,
                indexedAt: post.indexedAt
            };
        });

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
