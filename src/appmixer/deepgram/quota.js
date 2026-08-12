'use strict';

module.exports = {
    rules: [
        {
            // Light metadata calls (projects, models, request logs). Deepgram does not
            // publish a hard rate limit for these, so this is a conservative guard.
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        },
        {
            // Processing endpoints (/v1/listen, /v1/speak, /v1/read) are limited by
            // *concurrency*, not by request rate - Deepgram allows roughly 10 in-flight
            // requests per project. A sliding window cannot express that: 100 long-running
            // transcriptions can still start together and all get 429s. Cap in-flight work.
            limit: 10,
            throttling: 'limit-concurrency',
            queueing: 'fifo',
            resource: 'inference',
            scope: 'userId'
        },
        {
            // Keep a rate ceiling on the processing endpoints as well.
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'inference',
            scope: 'userId'
        }
    ]
};
