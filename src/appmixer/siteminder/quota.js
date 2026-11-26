'use strict';

// SiteMinder publishes no numeric quota for the availability and rates API; it answers HTTP 429
// with a RETRY-AFTER header when a limit is hit. Its certification guide asks for at most 30
// requests per minute per property
// (https://developer.siteminder.com/smx-api/guides/testing-and-certification). The rule below
// applies that number to the whole account, which is the stricter reading. The reservation
// triggers make no request and are not counted.
module.exports = {
    rules: [
        {
            limit: 30,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
