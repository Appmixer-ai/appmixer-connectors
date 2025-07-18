module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        // Authentication fields shown to user
        auth: {
            apiKey: {
                type: 'text',
                name: 'Secret Key',
                tooltip: 'Your Clerk Secret Key from the API Keys page in the Clerk Dashboard'
            }
        },

        // How to extract account name from profile info
        accountNameFromProfileInfo: 'email',

        // Fetch user profile information
        requestProfileInfo: async (context) => {
            // Get user's own profile using the backend API
            return context.httpRequest({
                method: 'GET',
                url: 'https://api.clerk.com/v1/me',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                },
                json: true
            });
        },

        // Validate credentials
        validate: async (context) => {
            // Test the API key by making a request to get a list of users (limit 1)
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.clerk.com/v1/users?limit=1',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            // If the request doesn't fail, return true
            return true;
        }
    }
};
