'use strict';

// Manychat authenticates every request with an API token sent as a bearer token.
// The token belongs to one Manychat account (page) and is created under Settings → API.
// There is no OAuth flow for the public API. The API needs a Pro plan.
const API_BASE_URL = 'https://api.manychat.com';

const getPageInfo = async (context) => {

    try {
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `${API_BASE_URL}/fb/page/getInfo`,
            headers: { 'Authorization': `Bearer ${context.apiKey}` }
        });
        if (!data || data.status !== 'success' || !data.data) {
            throw new Error('Manychat did not return the account info.');
        }
        return data.data;
    } catch (err) {
        // Only a 401 means the token is wrong. Other errors keep their message,
        // so an outage or a missing Pro plan is not reported as an invalid token.
        if (err.response && err.response.status === 401) {
            throw new Error('Invalid Manychat API token.');
        }
        throw err;
    }
};

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Token',
                tooltip: 'In Manychat open <b>Settings → API</b> and click <b>Generate your token</b>. ' +
                    'The token looks like <code>1234567:abcdef...</code> and belongs to one Manychat account. ' +
                    'The Manychat API needs a Pro plan.'
            }
        },

        accountNameFromProfileInfo: 'name',

        requestProfileInfo: async (context) => {

            const page = await getPageInfo(context);
            return { id: page.id, name: page.name || `Manychat ${page.id}` };
        },

        validate: async (context) => {

            await getPageInfo(context);
            return true;
        }
    }
};
