'use strict';

module.exports = {

    rules: [
        {
            // Todoist has a rate limit of ~450 requests per 15 minutes
            limit: 400,
            window: 1000 * 60 * 15,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
