'use strict';

// cloro allows 1,000 requests per second per endpoint, so the rate limit is not the
// constraint. The plan's concurrency slots are: a request sent while all slots are
// busy gets a 429 (CONCURRENCY_LIMIT_EXCEEDED). A monitor request takes several
// seconds, so we queue the overflow at a modest rate to stay inside small plans.
module.exports = {

    rules: [
        {
            limit: 60,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
