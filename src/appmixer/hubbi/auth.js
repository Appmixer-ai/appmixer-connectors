'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        auth: {
            baseUrl: {
                type: 'text',
                name: 'Base URL',
                tooltip: 'The HubBI API base URL (e.g. https://test-app.hubbi.nl).'
            },
            token: {
                type: 'text',
                name: 'Bearer Token',
                tooltip: 'Your HubBI JWT bearer token.'
            },
            clientKey: {
                type: 'text',
                name: 'Client Key',
                tooltip: 'Your HubBI client identifier (UUID).'
            }
        },

        async requestProfileInfo(context) {
            const baseUrl = context.baseUrl.replace(/\/$/, '');
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/Flows/Home/HubsList?clientKey=${encodeURIComponent(context.clientKey)}`,
                headers: {
                    'Authorization': `Bearer ${context.token}`,
                    'Accept': 'application/json'
                }
            });
            return { name: `HubBI (${context.clientKey})` };
        },

        accountNameFromProfileInfo: 'name',

        validate: async (context) => {
            const baseUrl = context.baseUrl.replace(/\/$/, '');
            await context.httpRequest({
                method: 'GET',
                url: `${baseUrl}/Flows/Home/Index`,
                headers: {
                    'Authorization': `Bearer ${context.token}`
                }
            });
            return true;
        }
    }
};
