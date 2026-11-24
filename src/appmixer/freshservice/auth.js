'use strict';

const lib = require('./lib');

// Freshservice API key authentication: https://api.freshservice.com/#authentication
// Each agent finds their API key in Freshservice: profile picture (top right) > Profile settings.
// The key is sent with HTTP Basic auth as the user name, with "X" as the password. The account's
// domain (acme for acme.freshservice.com) forms the base URL; lib.serviceOrigin() allowlists it.

/**
 * One cheap read that every agent may do: the first ticket of the list.
 */
const check = async (context) => {

    try {
        await context.httpRequest({
            method: 'GET',
            url: `${lib.apiBaseUrl(context.domain)}/tickets`,
            params: { per_page: 1 },
            headers: lib.authHeaders(context.apiKey)
        });
    } catch (err) {
        const status = err.response && err.response.status;
        if (status === 401) {
            throw new Error(
                'Freshservice rejected the API key (401). Copy it again from Freshservice: profile picture > ' +
                'Profile settings > Your API Key.'
            );
        }
        if (status === 404) {
            throw new Error(
                'No Freshservice account at this domain (404). Enter the account name of your Freshservice URL, ' +
                'e.g. "acme" for https://acme.freshservice.com.'
            );
        }
        throw err;
    }
};

const maskKey = (apiKey) => {

    const key = String(apiKey || '').trim();
    return key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '****';
};

module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            domain: {
                type: 'text',
                name: 'Domain',
                tooltip: 'The account name in your Freshservice URL: for <i>https://acme.freshservice.com</i> enter <b>acme</b>.'
            },
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'In Freshservice, click your profile picture (top right) > Profile settings and copy <i>Your API Key</i>.'
            }
        },

        accountNameFromProfileInfo: 'name',

        // The API has no "current agent" endpoint: the account is named by its host and the masked key.
        requestProfileInfo: async (context) => {

            const origin = lib.serviceOrigin(context.domain);
            const apiKey = maskKey(context.apiKey);
            return {
                name: `${origin.replace('https://', '')} (${apiKey})`,
                apiKey
            };
        },

        validate: async (context) => {

            await check(context);
            return true;
        }
    }
};
