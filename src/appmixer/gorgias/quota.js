'use strict';

// Gorgias rate limits (https://developers.gorgias.com/reference/limitations): a leaky bucket of
// 40 requests per 20 seconds for API-key integrations, per account (Enterprise accounts: the same
// count in a 10-second window). Over the limit the API answers 429 with a Retry-after header, which
// lib.request() honours.
module.exports = {
    rules: [
        {
            limit: 40,
            window: 20 * 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
