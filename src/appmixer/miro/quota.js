'use strict';

// Miro counts rate limits in credits per user and app: 100,000 credits per minute, where a call
// costs 50 (Level 1), 100 (Level 2), 500 (Level 3) or 2,000 credits (Level 4)
// (https://developers.miro.com/reference/rate-limiting). The components use Level 1-3 methods.
// "requests" keeps a user's calls under the Level 2 budget (1,000 per minute); "heavy" adds the
// Level 3 budget (200 per minute) for creating, sharing and deleting boards and deleting items.
module.exports = {
    rules: [
        {
            limit: 900,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 180,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'heavy',
            scope: 'userId'
        }
    ]
};
