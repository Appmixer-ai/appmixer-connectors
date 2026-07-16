'use strict';

const lib = require('../../lib');
const { generateAuthorizationHeader, parseIPs, ACTIVATION_STATUS } = lib;

module.exports = {
    receive: async (context) => {
        const { hostnameUrl, accessToken, clientSecret, clientToken } =
            context.auth;
        const auth = { hostnameUrl, accessToken, clientSecret, clientToken };
        const { listId, value, description, ttl, network, waitForActivation, timeout } =
            context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List is required');
        }

        if (!value) {
            throw new context.CancelError('IP or IPs is required');
        }

        // A list already pending activation cannot be re-activated. This is common in
        // rapid sequential additions (e.g. blocking attacker after attacker) where a
        // previous activation is still in flight. Check before modifying entries so the
        // non-wait error path leaves the list untouched.
        const currentStatus = await lib.getActivationStatus(context, auth, listId, network);
        if (currentStatus === ACTIVATION_STATUS.PENDING) {
            if (!waitForActivation) {
                throw new context.CancelError(
                    `List ${listId} is already PENDING_ACTIVATION on the ${network} network, so it cannot be ` +
                    're-activated yet. Akamai activations can take 1-15+ minutes. Enable "Wait for Activation" ' +
                    'to poll until the current activation completes before adding more entries.'
                );
            }
            await lib.waitForActivation(context, auth, listId, network, { timeout: timeout || 300 });
        }

        // GET list items to check whether to append or update
        const {
            url: getItemsUrl,
            method: getItemsMethod,
            headers: { Authorization: getItemsAuthorization }
        } = generateAuthorizationHeader({
            hostnameUrl,
            accessToken,
            clientToken,
            clientSecret,
            method: 'GET',
            path: `/client-list/v1/lists/${listId}/items`
        });

        const { data: listEntries } = await context.httpRequest({
            url: getItemsUrl,
            method: getItemsMethod,
            headers: { Authorization: getItemsAuthorization }
        });

        const currentEntries = listEntries.content.map((entry) => entry.value);

        const appendArr = [];
        const updateArr = [];

        const expirationDate = ttl
            ? new Date().getTime() + ttl * 1000
            : undefined;

        const ips = parseIPs(value);

        ips.forEach(ip => {
            const ipIndex = currentEntries.findIndex(
                (e) => e === ip
            );
            const newEntry = {
                value: ip,
                expirationDate,
                description
            };
            if (ipIndex > -1) {
                updateArr.push(newEntry);
            } else {
                appendArr.push(newEntry);
            }
        });

        const body = {
            append: appendArr,
            update: updateArr
        };

        // POST new or updated list items
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
            path: `/client-list/v1/lists/${listId}/items`,
            body
        });

        const { data } = await context.httpRequest({
            url,
            method,
            headers: { Authorization },
            data: body
        });

        // Activate list
        const activateBody = { action: 'ACTIVATE', network };

        const {
            url: ActivateUrl,
            method: ActivateMethod,
            headers: { Authorization: ActivateAuthorization }
        } = generateAuthorizationHeader({
            hostnameUrl,
            accessToken,
            clientToken,
            clientSecret,
            method: 'POST',
            path: `/client-list/v1/lists/${listId}/activations`,
            body: activateBody
        });

        const { data: activation } = await context.httpRequest({
            url: ActivateUrl,
            method: ActivateMethod,
            headers: { Authorization: ActivateAuthorization },
            data: activateBody
        });

        // Optionally block until the activation reaches ACTIVE so downstream steps
        // (e.g. another rapid addition) don't hit a still-pending list.
        let activationStatus = activation && activation.activationStatus;
        if (waitForActivation) {
            activationStatus = await lib.waitForActivation(context, auth, listId, network, { timeout: timeout || 300 });
        }

        let addedResponse = [];
        let updatedResponse = [];
        if (data.appended.length > 0) {
            addedResponse = data.appended.map(r => {
                return {
                    action: 'added',
                    ...r
                };
            });
        }
        if (data.updated.length > 0) {
            updatedResponse = data.updated.map(r => {
                return {
                    action: 'updated',
                    ...r
                };
            });
        }

        const response = {
            entries: addedResponse.concat(updatedResponse),
            activationStatus
        };

        return context.sendJson(response, 'out');
    }
};
