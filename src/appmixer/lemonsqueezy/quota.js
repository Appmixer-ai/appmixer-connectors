'use strict';

module.exports = {

    rules: [
        {
            limit: 5,
            window: 1000,
            throttling: 'auto',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
