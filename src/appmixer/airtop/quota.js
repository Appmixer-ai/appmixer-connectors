'use strict';

module.exports = {
    rules: [
        {
            // Light calls: session listing/details, termination, MakeApiCall.
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            // Caps how many browser operations are in flight at once. Airtop holds
            // the HTTP response open for the whole operation, so receive() blocks for
            // its duration and this slot genuinely bounds concurrent work — unlike a
            // submit-and-return component. Excess messages wait in the quota queue
            // instead of holding unacked messages against the consumer prefetch.
            limit: 5,
            throttling: 'limit-concurrency',
            queueing: 'fifo',
            resource: 'browser-operations',
            scope: 'userId'
        },
        {
            // Rate ceiling on the same operations, matching the light-call rule.
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'browser-operations',
            scope: 'userId'
        }
    ]
};
