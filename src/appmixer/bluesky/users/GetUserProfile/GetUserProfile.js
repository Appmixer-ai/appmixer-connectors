'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { actor } = context.messages.in.content;

        if (!actor) {
            throw new context.CancelError('Handle or DID is required!');
        }

        const profile = await lib.xrpc(context, {
            method: 'GET',
            nsid: 'app.bsky.actor.getProfile',
            params: { actor }
        });

        return context.sendJson(profile, 'out');
    }
};
