'use strict';

module.exports = {

    rules: [
        // Bigin counts API calls as credits per 24 hours (Zoho API limits). The limit depends on
        // the Bigin edition and its user licences; 5000 a day matches the Zoho CRM module.
        {
            limit: 5000,
            window: 1000 * 60 * 60 * 24,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
