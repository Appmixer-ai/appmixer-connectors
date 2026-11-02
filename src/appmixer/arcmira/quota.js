'use strict';

// Arcmira rate limits are per API key and per 60-second window: 60 requests on the free plan,
// 240 on paid plans, 600 on enterprise (GET /v1/me -> rate_limit). The free-plan limit is used
// so that no plan is throttled by the provider.
// See https://arcmira.com/docs
module.exports = {
    rules: [
        {
            limit: 60,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
