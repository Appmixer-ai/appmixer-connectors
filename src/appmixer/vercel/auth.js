module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiToken: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Your Vercel API token. Create one in your Vercel account settings under "Tokens". The token should have the necessary permissions for your team or personal account.'
            }
        },

        accountNameFromProfileInfo: 'user.email',

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://api.vercel.com/v2/user',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        },

        validate: async (context) => {
            try {
                await context.httpRequest({
                    method: 'GET',
                    url: 'https://api.vercel.com/v2/user',
                    headers: {
                        'Authorization': `Bearer ${context.apiToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return true;
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    throw new Error('Invalid API token. Please check your Vercel API token.');
                }
                throw error;
            }
        }
    }
};
