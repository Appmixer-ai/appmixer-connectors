'use strict';

// Workday publishes no per-second REST limit and answers 429 when a tenant is
// throttled. Third parties cite about 10 requests per second per tenant, so stay
// below that per user.
module.exports = {
    rules: [
        {
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
