'use strict';

module.exports = {
    rules: [
        {
            limit: 100,                          // Max 100 requests per minute
            window: 1000 * 60,                   // 1 minute window
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
