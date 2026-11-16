'use strict';

// Cal.com allows 120 requests per minute for an API key.
module.exports = {
    rules: [
        {
            limit: 120,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
