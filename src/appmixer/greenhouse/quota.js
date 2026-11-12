'use strict';

// Harvest v3 limits requests per API credential in fixed 30-second windows and answers
// 429 with Retry-After when the limit is exceeded (lib.apiRequest waits and retries).
// The documented example limit is 75 requests per window; stay under it.
module.exports = {
    rules: [
        {
            limit: 60,
            window: 30 * 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
