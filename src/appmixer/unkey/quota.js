'use strict';

module.exports = {
    rules: [
        // General API rate limit - Unkey has generous limits
        // Using conservative limits to avoid abuse
        {
            limit: 100,
            window: 1000 * 60, // 1 minute
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        // Key creation has lower limits to prevent abuse
        {
            limit: 10,
            window: 1000 * 60, // 1 minute
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'keys.create',
            scope: 'userId'
        },
        // Key verification can be more frequent
        {
            limit: 1000,
            window: 1000 * 60, // 1 minute
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'keys.verify',
            scope: 'userId'
        }
    ]
};
