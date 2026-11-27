'use strict';

// PandaDoc limits production API keys per endpoint (100 to 2000 requests per minute; Download
// Document has the lowest, 100) and sandbox keys to 10 requests per minute for any endpoint.
// The rule keeps a user under the lowest production limit; lib.request() waits out a 429
// (Retry-After), which is what a sandbox key runs into.
module.exports = {
    rules: [
        {
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
