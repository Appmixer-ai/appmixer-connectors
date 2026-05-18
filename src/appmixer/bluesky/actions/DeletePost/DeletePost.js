'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { postUri } = context.messages.in.content;

        if (!postUri) {
            throw new context.CancelError('Post URI is required!');
        }

        // Extract rkey from the AT URI: at://did:plc:xxx/app.bsky.feed.post/<rkey>
        const parts = postUri.split('/');
        const rkey = parts[parts.length - 1];

        if (!rkey) {
            throw new context.CancelError('Could not extract rkey from Post URI.');
        }

        const result = await lib.xrpc(context, {
            method: 'POST',
            nsid: 'com.atproto.repo.deleteRecord',
            data: {
                repo: context.auth.handle,
                collection: 'app.bsky.feed.post',
                rkey
            }
        });

        return context.sendJson(result || {}, 'out');
    }
};
