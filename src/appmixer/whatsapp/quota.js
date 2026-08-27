'use strict';

// WhatsApp Business Cloud API rate limits (conservative defaults — actual
// throughput depends on the phone number tier and quality rating).
// See https://developers.facebook.com/docs/whatsapp/cloud-api/overview#rate-limiting
module.exports = {
    rules: [
        {
            limit: 80,
            window: 1000,                  // per second — Cloud API messaging cap (lowest tier)
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'messages',
            scope: 'userId'
        },
        {
            limit: 200,
            window: 1000 * 60 * 60,        // 200 / hour — general Graph API requests
            throttling: 'window-sliding',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
