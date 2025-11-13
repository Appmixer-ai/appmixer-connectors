'use strict';

module.exports = {
    rules: [
        {
            limit: 1000,                          // Max 1000 calls per hour
            throttling: 'window-sliding',
            window: 1000 * 60 * 60,               // 1 hour
            scope: 'userId',
            resource: 'requests'
        },
        {
            limit: 10,                            // Max 10 calls per second
            throttling: 'window-sliding',
            window: 1000,                         // 1 second
            queueing: 'fifo',
            scope: 'userId',
            resource: 'requests'
        }
    ]
};
