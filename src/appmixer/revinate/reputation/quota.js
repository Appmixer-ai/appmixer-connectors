'use strict';

// Revinate publishes no rate limit for the Porter API. These rules are this connector's own,
// deliberately low for an API whose limits are unknown. They count component runs, not HTTP
// requests: a trigger check reads up to 10 pages.
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
