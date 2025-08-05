'use strict';

module.exports = {

    rules: [
        {
            limit: 5,
            window: 1000,
            queueing: 'fifo',
            resource: 'requests'
        },
        {
            limit: 5,
            window: 60000,
            queueing: 'fifo',
            resource: 'requests-projects'
        }
    ]
};
