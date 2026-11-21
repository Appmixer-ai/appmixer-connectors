'use strict';

// Freshservice rate limits (https://api.freshservice.com/#rate_limit) are per minute and account
// wide, by plan: Starter 100, Growth 200, Pro 400, Enterprise 500 requests per minute (the free
// trial is on the lowest tier). The rule keeps one user's flows under the Starter limit; the
// components also retry a 429 after its Retry-After.
module.exports = {
    rules: [
        {
            limit: 90,
            window: 60 * 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
