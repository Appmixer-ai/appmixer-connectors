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
            limit: 10,
            window: 1000,
            queueing: 'fifo',
            resource: 'ten-requests'
        },
        {
            limit: 75,
            window: 1000,
            queueing: 'fifo',
            resource: 'lists'
        }
    ]
};
