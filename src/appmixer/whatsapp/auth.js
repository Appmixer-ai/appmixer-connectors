'use strict';

module.exports = {

    type: 'apiKey',

    definition: {

        auth: {
            accessToken: {
                type: 'password',
                name: 'Access Token',
                tooltip: 'A System User access token from Meta Business Suite with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions. See <a href="https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens/" target="_blank">Meta docs</a>.'
            },
            businessAccountId: {
                type: 'text',
                name: 'Business Account ID (WABA ID)',
                tooltip: 'Your WhatsApp Business Account ID. Found in Meta Business Suite under Settings → WhatsApp Accounts.'
            },
            phoneNumberId: {
                type: 'text',
                name: 'Phone Number ID',
                tooltip: 'The Phone Number ID associated with your WABA. Found in Meta Business Suite or via API at <code>/{waba-id}/phone_numbers</code>.'
            },
            appId: {
                type: 'text',
                name: 'Meta App ID (optional)',
                tooltip: 'Your Meta App ID. Required only for webhook triggers (NewMessage, MessageStatusUpdated). Leave blank if you only use action components.'
            },
            appSecret: {
                type: 'password',
                name: 'Meta App Secret (optional)',
                tooltip: 'Your Meta App Secret. Required only for webhook triggers (to verify <code>X-Hub-Signature-256</code> payload signatures).'
            }
        },

        accountNameFromProfileInfo: 'displayName',

        requestProfileInfo: async (context) => {
            // Verify credentials by fetching the WABA details.
            const { data } = await context.httpRequest({
                method: 'GET',
                url: `https://graph.facebook.com/v22.0/${context.businessAccountId}`,
                params: { fields: 'id,name,timezone_id' },
                headers: { 'Authorization': `Bearer ${context.accessToken}` }
            });

            return {
                id: data.id,
                displayName: data.name || data.id,
                timezoneId: data.timezone_id
            };
        },

        validate: async (context) => {
            await context.httpRequest({
                method: 'GET',
                url: `https://graph.facebook.com/v22.0/${context.businessAccountId}`,
                params: { fields: 'id' },
                headers: { 'Authorization': `Bearer ${context.accessToken}` }
            });
            return true;
        }
    }
};
