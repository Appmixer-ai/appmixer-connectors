'use strict';

const BASE_URL = 'https://bsky.social';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            handle: {
                type: 'text',
                name: 'Handle',
                tooltip: 'Your Bluesky handle, e.g. <b>alice.bsky.social</b>. You can find it in your Bluesky profile settings.'
            },
            appPassword: {
                type: 'password',
                name: 'App Password',
                tooltip: 'Generate an app-specific password at <a href="https://bsky.app/settings/app-passwords" target="_blank">bsky.app/settings/app-passwords</a>. Do NOT use your main account password.'
            }
        },

        accountNameFromProfileInfo: 'handle',

        requestProfileInfo: async (context) => {
            // Exchange handle + app-password for a session token, then return profile info.
            const sessionResp = await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}/xrpc/com.atproto.server.createSession`,
                data: {
                    identifier: context.handle,
                    password: context.appPassword
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const { accessJwt, refreshJwt, did, handle, email } = sessionResp.data;

            // Store the tokens so components can read them from context.auth.*
            context.auth.accessJwt = accessJwt;
            context.auth.refreshJwt = refreshJwt;
            context.auth.did = did;

            return {
                handle,
                did,
                email: email || handle
            };
        },

        validate: async (context) => {
            // Validate by attempting to create a session.
            await context.httpRequest({
                method: 'POST',
                url: `${BASE_URL}/xrpc/com.atproto.server.createSession`,
                data: {
                    identifier: context.handle,
                    password: context.appPassword
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return true;
        }
    }
};
