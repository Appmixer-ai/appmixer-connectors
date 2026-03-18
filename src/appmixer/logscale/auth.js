'use strict';

module.exports = {
    type: 'apiKey',
    definition: {
        tokenType: 'authentication-token',

        auth: {
            url: {
                type: 'text',
                name: 'Ingestion URL',
                tooltip: 'Full Falcon LogScale ingestion endpoint URL, for example https://cloud.humio.com/api/v1/ingest/hec or https://<tenant>.ingest.<region>.crowdstrike.com/services/collector.'
            },
            apiKey: {
                type: 'text',
                name: 'Ingest API Key',
                tooltip: 'Falcon LogScale ingest token used in the Authorization header.'
            }
        },

        accountNameFromProfileInfo: 'accountLabel',

        requestProfileInfo: async (context) => {
            return {
                accountLabel: `${context.url} (${context.apiKey.substring(0, 8)}...${context.apiKey.substring(context.apiKey.length - 4)})`
            };
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'POST',
                url: context.url,
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    event: 'appmixer auth validation',
                    source: 'appmixer-auth-validation',
                    sourcetype: '_json',
                    host: 'appmixer'
                }
            });
            return true;
        }
    }
};
