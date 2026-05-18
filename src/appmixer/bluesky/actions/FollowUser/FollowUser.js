'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { actor } = context.messages.in.content;

        if (!actor) {
            throw new context.CancelError('Handle or DID is required!');
        }

        let did = actor;

        // If actor looks like a handle (not a DID), resolve it to a DID
        if (!actor.startsWith('did:')) {
            const resolved = await lib.xrpc(context, {
                method: 'GET',
                nsid: 'com.atproto.identity.resolveHandle',
                params: { handle: actor }
            });
            did = resolved.did;
        }

        const result = await lib.xrpc(context, {
            method: 'POST',
            nsid: 'com.atproto.repo.createRecord',
            data: {
                repo: context.auth.handle,
                collection: 'app.bsky.graph.follow',
                record: {
                    $type: 'app.bsky.graph.follow',
                    subject: did,
                    createdAt: new Date().toISOString()
                }
            }
        });

        return context.sendJson(result, 'out');
    }
};
