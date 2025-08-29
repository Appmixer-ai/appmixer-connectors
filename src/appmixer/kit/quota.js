'use strict';

module.exports = {

    rules: [
        {
            limit: 120,
            window: 1000 * 60,
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
