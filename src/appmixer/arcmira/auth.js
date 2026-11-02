'use strict';

const lib = require('./lib');

// Arcmira API — API-key authentication.
//
// Account keys (arc_sk_...) are created in the Arcmira dashboard (https://arcmira.com/docs) and
// sent as a Bearer token. GET /v1/me describes the key: the paying account (personal or team),
// the masked email of the person and the key label. It answers even when the account has used
// up its credits, so it is safe as the credential check.
module.exports = {

    type: 'apiKey',

    definition: {

        tokenType: 'authentication-token',

        auth: {
            apiKey: {
                type: 'password',
                name: 'API Key',
                tooltip: 'Your Arcmira account API key (starts with <code>arc_sk_</code>). See <a href="https://arcmira.com/docs" target="_blank">arcmira.com/docs</a>. Paid reads use credits from your plan, then your on-demand budget.'
            }
        },

        accountNameFromProfileInfo: 'accountName',

        requestProfileInfo: async (context) => {

            const { data } = await context.httpRequest({
                method: 'GET',
                url: `${lib.API_BASE_URL}/me`,
                headers: { 'Authorization': `Bearer ${context.apiKey}`, 'Accept': 'application/json' }
            });

            const account = (data && data.account) || {};
            const person = data.email_masked || data.key_label || data.user_id || 'Arcmira account';
            const accountName = account.kind === 'team' && account.name
                ? `${account.name} (${person})`
                : person;

            return {
                accountName,
                userId: data.user_id,
                keyId: data.key_id,
                keyLabel: data.key_label,
                emailMasked: data.email_masked,
                tier: data.tier,
                accountId: account.id,
                accountKind: account.kind
            };
        },

        validate: async (context) => {

            await context.httpRequest({
                method: 'GET',
                url: `${lib.API_BASE_URL}/me`,
                headers: { 'Authorization': `Bearer ${context.apiKey}`, 'Accept': 'application/json' }
            });

            return true;
        }
    }
};
