'use strict';

// Bluesky / AT Protocol rate limits (published):
//   - General XRPC: 3 000 requests per 5 minutes per user
//   - Write operations: 500 per hour per user (conservative)
module.exports = {
    rules: [
        // General XRPC calls: max 3 000 per 5 minutes per user
        {
            limit: 3000,
            window: 1000 * 60 * 5,       // 5 minutes
            throttling: 'window-sliding',
            resource: 'xrpc',
            scope: 'userId'
        },
        // Write operations (posts, likes, reposts, follows): max 500 per hour per user
        {
            limit: 500,
            window: 1000 * 60 * 60,      // 1 hour
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'writes',
            scope: 'userId'
        }
    ]
};
