'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',
        
        auth: {
            apiToken: {
                type: 'text',
                name: 'API Token',
                tooltip: 'Your MailerLite API token. You can find it in your MailerLite account under Integrations > Developer API.'
            }
        },

        accountNameFromProfileInfo: 'email',

        requestProfileInfo: async (context) => {
            const response = await context.httpRequest({
                method: 'GET',
                url: 'https://connect.mailerlite.com/api/me',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://connect.mailerlite.com/api/me',
                headers: {
                    'Authorization': `Bearer ${context.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return true;
        }
    }
};
