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

        const { query, lang, since, until, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Posts', value: 'posts' });
        }

        if (!query) {
            throw new context.CancelError('Search Query is required!');
        }

        const params = { q: query, limit: 25 };
        if (lang) params.lang = lang;
        if (since) params.since = since;
        if (until) params.until = until;

        const response = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.feed.searchPosts',
            params
        });

        const posts = response.posts || [];

        if (posts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        // Normalize the post objects to a flat structure
        const records = posts.map(post => ({
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
        }));

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
