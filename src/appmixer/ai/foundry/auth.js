'use strict';

const lib = require('./lib');

module.exports = {

    type: 'apiKey',

    definition: () => {

        return {
            auth: {
                endpoint: {
                    type: 'text',
                    name: 'Endpoint',
                    index: 1,
                    tooltip: 'Endpoint of your Azure AI Foundry (Azure OpenAI) resource, e.g. '
                        + '<code>https://my-resource.openai.azure.com</code> or '
                        + '<code>https://my-resource.services.ai.azure.com</code>. Find it in the Azure portal '
                        + 'under your resource, <i>Keys and Endpoint</i>, or on the overview page of your Foundry project.'
                },
                apiKey: {
                    type: 'password',
                    name: 'API Key',
                    index: 2,
                    tooltip: 'Key 1 or Key 2 of the same resource, from <i>Keys and Endpoint</i> in the Azure portal.'
                }
            },

            validate: async (context) => {

                try {
                    await lib.request(context, 'get', '/models');
                } catch (err) {
                    const status = err.response?.status;
                    if (status === 401 || status === 403) {
                        throw new context.InvalidTokenError('The API key was rejected by ' + lib.endpointOrigin(context)
                            + '. Check that the key belongs to this resource.');
                    }
                    if (status === 404) {
                        throw new Error('The endpoint does not serve the Azure OpenAI v1 API (/openai/v1). '
                            + 'Use the resource endpoint from "Keys and Endpoint" in the Azure portal.');
                    }
                    throw err;
                }
                return true;
            },

            accountNameFromProfileInfo: (context) => {

                const host = new URL(lib.endpointOrigin(context)).hostname;
                const apiKey = context.apiKey || '';
                return `${host} (${apiKey.substr(0, 4)}...${apiKey.substr(-4)})`;
            }
        };
    }
};
