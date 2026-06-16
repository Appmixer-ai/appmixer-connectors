'use strict';

/**
 * Power BI REST API rate limiting.
 * Microsoft throttles Power BI REST API calls per user.
 * Conservative defaults: 120 requests per minute per user.
 * Reference: https://docs.microsoft.com/en-us/power-bi/developer/embedded/api-rest-api
 */
module.exports = {

    rules: [
        {
            limit: 120,              // 120 requests per 60-second window
            window: 60000,           // 60 seconds
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
