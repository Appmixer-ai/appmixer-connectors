'use strict';

async function getUserProfile(context) {

    const response = await context.httpRequest({
        method: 'POST',
        url: 'https://backboard.railway.com/graphql/v2',
        headers: {
            'Authorization': `Bearer ${context.apiKey}`,
            'Content-Type': 'application/json'
        },
        data: {
            query: '{ me { id name email } }'
        }
    });

    if (!response.data || !response.data.data || !response.data.data.me) {
        throw new Error('Authentication failed: Invalid API Key or unexpected response.');
    }

    return response.data.data.me;
}

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Log into your Railway account and find your API Token in the account settings.'
            }
        },

        async requestProfileInfo(context) {

            const profile = await getUserProfile(context);
            return profile;
        },

        accountNameFromProfileInfo: 'email',

        validate: async (context) => {

            // Use the common function to validate and get profile
            await getUserProfile(context);
            return true;
        }
    }
};
