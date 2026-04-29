'use strict';

module.exports = {
    rules: [
        {
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'vapi.api',
            scope: 'userId'
        },
        {
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
