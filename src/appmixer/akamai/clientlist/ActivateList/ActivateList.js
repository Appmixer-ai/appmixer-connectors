'use strict';

const lib = require('../../lib');
const { generateAuthorizationHeader, ACTIVATION_STATUS } = lib;

module.exports = {
    async receive(context) {
        const { hostnameUrl, accessToken, clientSecret, clientToken } =
            context.auth;
        const auth = { hostnameUrl, accessToken, clientSecret, clientToken };
        const { listId, network, comments, waitForActivation, timeout } =
            context.messages.in.content;
        if (!listId) {
            throw new context.CancelError('List is required');
        }

        if (!network) {
            throw new context.CancelError('Network is required');
        }

        // Check the current activation status before triggering a new activation.
        const currentStatus = await lib.getActivationStatus(context, auth, listId, network);

        // A list already pending activation cannot be re-activated. Either wait for it
        // to finish (so the caller can safely retry) or surface a clear error.
        if (currentStatus === ACTIVATION_STATUS.PENDING) {
            if (!waitForActivation) {
                throw new context.CancelError(
                    `List ${listId} is already PENDING_ACTIVATION on the ${network} network. ` +
                    'Akamai activations can take 1-15+ minutes to complete. Enable "Wait for Activation" ' +
                    'or retry once the current activation finishes.'
                );
            }
            await lib.waitForActivation(context, auth, listId, network, { timeout: timeout || 300 });
        }

        const body = { action: 'ACTIVATE', network, comments };

        const {
            url,
            method,
            headers: { Authorization }
        } = generateAuthorizationHeader({
            hostnameUrl,
            accessToken,
            clientToken,
            clientSecret,
            method: 'POST',
            path: `/client-list/v1/lists/${listId}/activations`,
            body
        });

        const { data } = await context.httpRequest({
            url,
            method,
            headers: { Authorization },
            data: body
        });

        // Optionally block until the activation reaches ACTIVE so downstream steps
        // don't proceed on a still-pending list.
        let finalStatus = data.activationStatus;
        if (waitForActivation) {
            finalStatus = await lib.waitForActivation(context, auth, listId, network, { timeout: timeout || 300 });
        }

        return context.sendJson(
            { ...data, previousActivationStatus: currentStatus, activationStatus: finalStatus },
            'out'
        );
    }
};
