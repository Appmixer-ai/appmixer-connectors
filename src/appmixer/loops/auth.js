'use strict';

// https://loops.so/docs/api-reference/api-key
const API_KEY_URL = 'https://app.loops.so/api/v1/api-key';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'Generate an API key in Loops under <a href="https://app.loops.so/settings?page=api" target="_blank">Settings &rarr; API</a>.'
            }
        },

        accountNameFromProfileInfo: 'teamName',

        requestProfileInfo: async (context) => {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: API_KEY_URL,
                headers: { 'Authorization': `Bearer ${context.apiKey}` }
            });
            return { teamName: data.teamName };
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: API_KEY_URL,
                headers: { 'Authorization': `Bearer ${context.apiKey}` }
            });
            return true;
        }
    }
};
