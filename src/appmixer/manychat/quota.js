'use strict';

// Manychat sets limits per endpoint: 10 requests per second for most subscriber and
// tag calls, up to 100 per second for reads such as getTags. Queue at the lowest one.
module.exports = {

    rules: [
        {
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
