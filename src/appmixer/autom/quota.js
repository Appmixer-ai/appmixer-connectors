'use strict';

// Autom allows up to 50 requests per second on the smallest plan. The connector queues requests at
// 600 per minute per user so a flow stays well inside every plan.
module.exports = {

    rules: [
        {
            limit: 600,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
