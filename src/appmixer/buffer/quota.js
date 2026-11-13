'use strict';

// Buffer counts requests per app client in 15-minute, 24-hour and 30-day windows. The base
// app client allowance is 100 requests per 15 minutes, growing by 10 for each authorized user.
// Keep one user under that base, and smooth bursts to a few requests per second.
module.exports = {
    rules: [
        {
            limit: 100,
            window: 1000 * 60 * 15,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 5,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
