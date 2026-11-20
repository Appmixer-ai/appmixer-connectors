'use strict';

module.exports = {

    rules: [
        // Cloud Storage has no per-user request quota; the limits are per resource (about one
        // write per second to the same object name, bucket create/delete rate limited per
        // project). This rule keeps one user's flows from flooding the API.
        {
            limit: 20,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
