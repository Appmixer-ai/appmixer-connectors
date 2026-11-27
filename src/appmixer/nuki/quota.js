'use strict';

// The Nuki Web API allows 4 requests per second, 100 per minute and 1000 per hour
// (https://docs.nuki.io/guide/endpoints/rate-limits/); the docs do not say whether that is counted
// per token or per account. These rules count component runs, not HTTP requests, and some
// components send up to four requests per run, so the limits sit well below Nuki's.
module.exports = {
    rules: [
        {
            limit: 1,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 40,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 400,
            window: 1000 * 60 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
