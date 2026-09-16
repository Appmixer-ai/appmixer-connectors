'use strict';

// LinkedIn daily limits reset at midnight UTC, which is also where the quota server
// starts a fixed 24-hour window (https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits).
const DAY = 1000 * 60 * 60 * 24;

module.exports = {

    rules: [
        // Posting limit per member.
        {
            limit: 150,
            window: DAY,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'shares',
            scope: 'userId'
        },
        // Application-wide safety limit.
        {
            limit: 100000,
            window: DAY,
            throttling: 'window-fixed',
            resource: 'shares'
        }
    ]
};
