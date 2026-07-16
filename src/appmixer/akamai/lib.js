const EdgeGrid = require('akamai-edgegrid');

// Client list activation statuses as returned by the Akamai Network/Client Lists API.
const ACTIVATION_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    MODIFIED: 'MODIFIED',
    PENDING: 'PENDING_ACTIVATION',
    FAILED: 'FAILED'
};

module.exports = {
    ACTIVATION_STATUS,

    generateAuthorizationHeader({ clientToken, clientSecret, accessToken, hostnameUrl, method, path, body, debug }) {
        const eg = new EdgeGrid(clientToken, clientSecret, accessToken, hostnameUrl, debug);

        const auth = eg.auth({
            path,
            method,
            body
        });

        return auth.request;
    },

    // Fetch the raw list details (including its activation status per network).
    async getList(context, auth, listId) {
        const { hostnameUrl, accessToken, clientSecret, clientToken } = auth;
        const {
            url,
            method,
            headers: { Authorization }
        } = this.generateAuthorizationHeader({
            hostnameUrl,
            accessToken,
            clientToken,
            clientSecret,
            method: 'GET',
            path: `/client-list/v1/lists/${listId}`
        });

        const { data } = await context.httpRequest({
            url,
            method,
            headers: { Authorization }
        });

        return data;
    },

    // Return the activation status of a list for the given network (STAGING/PRODUCTION).
    async getActivationStatus(context, auth, listId, network) {
        if (network !== 'PRODUCTION' && network !== 'STAGING') {
            throw new context.CancelError(`Invalid network "${network}". Expected STAGING or PRODUCTION.`);
        }
        const list = await this.getList(context, auth, listId);
        const key = network === 'PRODUCTION'
            ? 'productionActivationStatus'
            : 'stagingActivationStatus';
        return list[key];
    },

    // Poll the list activation status until it reaches ACTIVE, fails, or the timeout is hit.
    // timeout and interval are given in seconds. Returns the final activation status.
    async waitForActivation(context, auth, listId, network, { timeout = 300, interval = 15 } = {}) {
        const deadline = Date.now() + timeout * 1000;
        const intervalMs = Math.max(interval, 1) * 1000;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const status = await this.getActivationStatus(context, auth, listId, network);

            if (status === ACTIVATION_STATUS.ACTIVE) {
                return status;
            }

            if (status === ACTIVATION_STATUS.FAILED) {
                throw new context.CancelError(`Activation of list ${listId} on the ${network} network failed.`);
            }

            const remainingMs = deadline - Date.now();
            if (remainingMs <= 0) {
                throw new context.CancelError(
                    `Timed out after ${timeout}s waiting for list ${listId} to become ACTIVE on the ${network} network. ` +
                    `Current status: ${status}. Akamai activations can take 1-15+ minutes; increase the timeout or retry later.`
                );
            }

            await new Promise(resolve => setTimeout(resolve, Math.min(intervalMs, remainingMs)));
        }
    },

    parseIPs(input) {

        let ips = [];

        if (typeof input === 'string') {
            // Check if the string is a JSON array
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) {
                    ips = parsed;
                } else {
                    ips = input.split(/\s+|,/)
                        .filter(item => item)
                        .map(ip => ip.trim());
                }
            } catch (e) {
                ips = input.split(/\s+|,/)
                    .filter(item => item)
                    .map(ip => ip.trim());
            }
        } else if (Array.isArray(input)) {
            ips = input;
        }

        return ips;
    }

};
