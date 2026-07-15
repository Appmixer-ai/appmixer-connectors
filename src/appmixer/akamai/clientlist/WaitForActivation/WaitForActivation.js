'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { hostnameUrl, accessToken, clientSecret, clientToken } =
            context.auth;
        const auth = { hostnameUrl, accessToken, clientSecret, clientToken };
        const { listId, network, timeout } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List is required');
        }

        if (!network) {
            throw new context.CancelError('Network is required');
        }

        const activationStatus = await lib.waitForActivation(
            context,
            auth,
            listId,
            network,
            { timeout: timeout || 300 }
        );

        return context.sendJson({ listId, network, activationStatus }, 'out');
    }
};
