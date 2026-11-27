'use strict';

// Qlik Cloud rate limits apply per user and tenant: Tier 1 (most reads) 1000 requests per minute,
// Tier 2 (writes) 100 per minute, and special tiers for single endpoints (POST /reloads 50 per
// minute, POST /reports 10 per minute). https://qlik.dev/apis/rest/rate-limiting/
module.exports = {
    rules: [
        {
            limit: 1000,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'reads',
            scope: 'userId'
        },
        {
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'writes',
            scope: 'userId'
        },
        {
            limit: 50,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'reloads',
            scope: 'userId'
        },
        {
            limit: 10,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'reports',
            scope: 'userId'
        }
    ]
};
