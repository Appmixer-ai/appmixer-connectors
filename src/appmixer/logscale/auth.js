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
            // The CrowdStrike LogScale ingest host only exposes the HEC collector endpoint —
            // no separate health/status API exists. POSTing a truly empty body (0 bytes)
            // returns the auth status without ingesting any event:
            //   200 {"text":"Success","code":0}   -> valid token
            //   401                               -> invalid token
            // NOTE: data must be null (not '' or {}); axios would serialize those to
            // '""' / '{}' which HEC rejects with 400 "Invalid data format".
            const response = await context.httpRequest({
                method: 'POST',
                url: context.url,
                headers: {
                    'Authorization': `Bearer ${context.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': '0'
                },
                data: null
            });

            const code = response.data && response.data.code;
            if (code !== 0) {
                throw new Error(
                    response.data && response.data.text
                        ? `LogScale auth failed: ${response.data.text}`
                        : 'LogScale auth failed: invalid token'
                );
            }
            return true;
        }
    }
};
