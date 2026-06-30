'use strict';

// Azure DevOps enforces a rate limit of approximately 200 TSTUs
// (Time-Scaled Throttling Units) per user per 5-minute sliding window.
module.exports = {
    rules: [
        {
            limit: 200,
            window: 1000 * 60 * 5, // 5 minutes
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
