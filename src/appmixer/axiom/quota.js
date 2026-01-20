'use strict';

module.exports = {

    rules: [
        // General API rate limit - 1000 requests per minute
        {
            limit: 1000,
            window: 1000 * 60, // 60 seconds
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        // Ingest rate limit - 100 requests per minute
        {
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'ingest',
            scope: 'userId'
        }
    ]
};
