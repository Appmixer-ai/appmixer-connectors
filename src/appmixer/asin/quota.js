'use strict';

// Asin reads Amazon data through its own tracking. The connector queues requests at
// 120 per minute per user so a flow stays well inside every plan.
module.exports = {

    rules: [
        {
            limit: 120,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
