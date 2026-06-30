'use strict';

// GoHighLevel API rate limits:
// - Standard: 100 requests per 10 seconds per location
// - Burst: up to 200 requests in short window
module.exports = {
    rules: [
        {
            limit: 100,
            window: 1000 * 10,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
