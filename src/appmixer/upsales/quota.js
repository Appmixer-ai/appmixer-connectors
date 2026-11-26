'use strict';

// https://api.upsales.com/ - "Rate Limits": every request made with an API key is counted
// against several fixed windows at once: 200 requests / 10 s, 6 000 / 10 min and
// 20 000 / 1 h for all requests, plus 2 000 / 10 min and 5 000 / 1 h for writes
// (POST, PUT, PATCH, DELETE). The rules below stay a little under those limits.
module.exports = {

    rules: [
        {
            limit: 18,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 5500,
            window: 1000 * 60 * 10,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 19000,
            window: 1000 * 60 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 1900,
            window: 1000 * 60 * 10,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'writes',
            scope: 'userId'
        },
        {
            limit: 4800,
            window: 1000 * 60 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'writes',
            scope: 'userId'
        }
    ]
};
