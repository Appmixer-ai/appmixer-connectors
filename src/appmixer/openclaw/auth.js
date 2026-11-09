'use strict';

const lib = require('./lib');

// OpenClaw gateway HTTP hooks authenticate with the hook token (hooks.token in the gateway
// config) sent as `Authorization: Bearer <token>`. It is a dedicated token, not the gateway's
// operator token: it can start hook runs, nothing else.
module.exports = {

    name: 'appmixer:openclaw',

    type: 'apiKey',

    definition: {

        auth: {
            gatewayUrl: {
                type: 'text',
                name: 'Gateway URL',
                // eslint-disable-next-line max-len
                tooltip: 'The https address your OpenClaw gateway (or the reverse proxy in front of it) is reachable at, for example <i>https://openclaw.example.com</i>.'
            },
            hooksPath: {
                type: 'text',
                name: 'Hooks Path',
                // eslint-disable-next-line max-len
                tooltip: 'The <code>hooks.path</code> of the gateway config. Leave empty for the default <code>/hooks</code>.'
            },
            token: {
                type: 'password',
                name: 'Hook Token',
                // eslint-disable-next-line max-len
                tooltip: 'The <code>hooks.token</code> of the gateway config (hooks must be enabled: <code>hooks.enabled: true</code>). Use the dedicated hook token, never the gateway operator token.'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: context => {

            // The hooks API has no profile endpoint: the account is named after the gateway
            // host and the masked token. Pure, so a valid account is never blocked here.
            let host = 'OpenClaw gateway';
            try {
                host = new URL(lib.gatewayOrigin(context.gatewayUrl)).host;
            } catch (error) {
                // validate() reports a bad URL; the name falls back
            }
            const token = context.token || '';
            const masked = token.length > 8 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****';
            return { name: `${host} (${masked})` };
        },

        validate: async context => {

            // An agent hook with no message: the gateway checks the token first (401), then the
            // payload (400 "message required"), so a 400 proves the token without starting a run.
            const url = lib.hooksBaseUrl(context) + '/agent';
            try {
                await context.httpRequest({
                    method: 'POST',
                    url,
                    headers: lib.authHeaders(context),
                    data: {}
                });
            } catch (error) {
                const status = error.response && error.response.status;
                if (status === 400) {
                    return true;
                }
                if (status === 401) {
                    throw new Error('The gateway rejected the hook token.');
                }
                if (status === 403 || status === 404) {
                    // 404 from the gateway (hooks disabled, wrong path); 403 usually from a proxy
                    // that forwards only listed paths
                    // eslint-disable-next-line max-len
                    throw new Error(`No hooks endpoint at ${url} (HTTP ${status}). Check that hooks are enabled on the gateway, the Hooks Path, and that a reverse proxy forwards ${url}.`);
                }
                if (status === 429) {
                    throw new Error('The gateway throttles failed hook logins (HTTP 429). Wait a minute and check the token.');
                }
                throw error;
            }
            // A 2xx means something ran a hook without a message: not an OpenClaw gateway
            throw new Error(`${url} accepted an empty agent request, so it is not an OpenClaw hooks endpoint.`);
        }
    }
};
