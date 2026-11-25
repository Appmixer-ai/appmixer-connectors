'use strict';

// https://loops.so/docs/api-reference/intro#rate-limiting
// Baseline: 10 requests per second per team.
// Content API (/v1/transactional-emails/*, /v1/campaigns/*, ...): 60 requests per 60 seconds per team.
module.exports = {

    rules: [
        {
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            limit: 60,
            window: 60 * 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'content',
            scope: 'userId'
        }
    ]
};
