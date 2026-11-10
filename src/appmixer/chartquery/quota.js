'use strict';

// ChartQuery renders images on demand. The connector queues requests at
// 300 per minute per user so a flow stays well inside every plan.
module.exports = {

    rules: [
        {
            limit: 300,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
