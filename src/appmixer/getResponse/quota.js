'use strict';

module.exports = {

    rules: [
        {
            limit: 5,
            throttling: 'window-sliding',
            window: 1000,
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
