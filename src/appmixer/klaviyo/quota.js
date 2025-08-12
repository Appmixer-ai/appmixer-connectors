'use strict';

module.exports = {

    rules: [
        {
            limit: 1,
            window: 1000,
            queueing: 'fifo',
            resource: 'requests'
        },
        {
            limit: 3,
            window: 1000,
            queueing: 'fifo',
            resource: 'three-requests'
        },
        {
            limit: 10,
            window: 1000,
            queueing: 'fifo',
            resource: 'ten-requests'
        },
        {
            limit: 75,
            window: 1000,
            queueing: 'fifo',
            resource: 'seventy-five-requests'
        },
        {
            limit: 350,
            window: 1000,
            queueing: 'fifo',
            resource: 'three-fifty-requests'
        }
    ]
};
