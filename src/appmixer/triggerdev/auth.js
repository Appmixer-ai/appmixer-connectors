'use strict';

module.exports = {
    type: 'apiKey',

    definition: {
        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'text',
                name: 'API Key',
                tooltip: 'Your Trigger.dev API key. You can find this in your Trigger.dev project settings under API Keys.'
            },
            baseUrl: {
                type: 'text',
                name: 'Base URL',
                tooltip: 'Your Trigger.dev instance URL (e.g., https://cloud.trigger.dev for cloud or your self-hosted URL)',
                defaultValue: 'https://cloud.trigger.dev'
            }
        },

        accountNameFromProfileInfo: context => {
            return context.apiKey.substring(0, 8) + '...';
        },

        requestProfileInfo: async context => {
            // Trigger.dev doesn't have a dedicated profile endpoint
            // We'll return the obfuscated API key as profile info
            return {
                apiKey: context.apiKey.substring(0, 8) + '...'
            };
        },

        validate: async context => {
            // Validate by making a simple API call
            const baseUrl = context.baseUrl || 'https://cloud.trigger.dev';
            await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/api/v1/projects`,
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`
                }
            });
            return true;
        }
    }
};
