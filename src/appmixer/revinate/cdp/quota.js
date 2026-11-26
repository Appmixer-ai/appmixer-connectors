'use strict';

// The CDP API rejects "requests in excess of agreed upon quotas" (https://developer.revinate.com/):
// the quota is part of each customer's contract and no number is published. These rules are this
// connector's own, deliberately low. They count component runs, not HTTP requests: a trigger check
// reads up to 20 pages.
module.exports = {
    rules: [
        {
            limit: 2,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
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
