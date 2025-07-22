'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',
        
        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Enter your Resend API key. You can find it in your Resend dashboard under API Keys.'
            }
        },
        
        accountNameFromProfileInfo: 'email',
        
        requestProfileInfo: async (context) => {
            const { data } = await context.httpRequest({
                method: 'GET',
                url: 'https://api.resend.com/v1/domains',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            
            // Use the first domain's email or a default
            return {
                email: data && data.data && data.data.length > 0
                    ? `user@${data.data[0].name}`
                    : 'user@resend.com'
            };
        },
        
        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: 'https://api.resend.com/v1/domains',
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            
            return true;
        }
    }
};
