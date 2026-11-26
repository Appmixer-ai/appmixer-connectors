'use strict';

// Lime CRM Cloud allows 3000 requests per 5 minutes per IP address; on-premise servers
// configure their own limit. Stay under the cloud limit per user.
module.exports = {
    rules: [
        {
            limit: 2400,
            window: 5 * 60 * 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 15,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
