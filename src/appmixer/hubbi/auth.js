'use strict';

// Both the profile lookup and the validation check hit the same endpoint. A
// blank field would otherwise surface as a TypeError from .replace()/.slice()
// instead of a readable authentication error.
async function listTargetHubs(context) {

    const { baseUrl, token, clientKey } = context;

    if (!baseUrl || !token || !clientKey) {
        throw new Error('Base URL, Bearer Token and Client Key are all required.');
    }

    return context.httpRequest({
        method: 'GET',
        url: `${baseUrl.replace(/\/$/, '')}/Flows/Home/ListTargetHubs?clientKey=${encodeURIComponent(clientKey)}`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
}

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
            await listTargetHubs(context);
            const ck = context.clientKey;
            const maskedKey = ck.length > 6 ? ck.slice(0, 3) + '...' + ck.slice(-3) : ck;
            return { name: `HubBI (${maskedKey})` };
        },

        accountNameFromProfileInfo: 'name',

        validate: async (context) => {
            await listTargetHubs(context);
            return true;
        }
    }
};
