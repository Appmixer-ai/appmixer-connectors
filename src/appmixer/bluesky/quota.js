'use strict';

// Bluesky / AT Protocol does not publish hard rate limits,
// but the createSession endpoint is known to allow ~30 calls / 5 min.
// For general API calls we apply a conservative fair-use limit.
module.exports = {
    rules: [
        // Auth / session creation: max 30 per 5 minutes per user
        {
            limit: 30,
            window: 1000 * 60 * 5,      // 5 minutes
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'session',
            scope: 'userId'
        },
        // General XRPC calls: max 3 000 per hour per user (conservative fair-use)
        {
            limit: 3000,
            window: 1000 * 60 * 60,     // 1 hour
            throttling: 'window-sliding',
            resource: 'xrpc',
            scope: 'userId'
        },
        // Write operations (posts, likes, reposts, follows): max 500 per hour per user
        {
            limit: 500,
            window: 1000 * 60 * 60,     // 1 hour
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'writes',
            scope: 'userId'
        }
    ]
};
