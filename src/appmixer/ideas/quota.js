'use strict';

// IDeaS documents rate limiting (HTTP 429 with Retry-After,
// https://developers.ideas.com/developer-guide/response/) but publishes no numbers. The rule below
// is a cautious default of this connector, not a number of the vendor: 5 requests a second per
// user. The access token has its own budget of 6 requests an hour (lib.getAccessToken()).
module.exports = {
    rules: [
        {
            limit: 5,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
