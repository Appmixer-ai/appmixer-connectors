module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',
        
        auth: {
            baseUrl: {
                type: 'text',
                name: 'Base URL',
                tooltip: 'Your Retool organization URL (e.g., https://yourorg.retool.com or https://your-retool-domain.com for on-premise)'
            },
            apiToken: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Generate an API token in your Retool Settings > API tokens. The token inherits your user permissions.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {
            const baseUrl = context.baseUrl.replace(/\/$/, '');
            
            const response = await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/api/v1/users/me`,
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'Content-Type': 'application/json'
                },
                json: true
            });
            
            return {
                apiKey: context.apiToken.substring(0, 8) + '...',  // Obfuscated token
                email: response.data?.email || response.data?.emailAddress || 'unknown@retool.com'
            };
        },

        validate: async (context) => {
            const baseUrl = context.baseUrl.replace(/\/$/, '');
            
            await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/api/v1/users/me`,
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return true;
        }
    }
};
