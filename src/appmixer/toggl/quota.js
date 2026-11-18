'use strict';

// Toggl Track limits (https://engineering.toggl.com/docs/track/):
//   - Leaky bucket per API token and IP: "a safe window will be 1 request per second" (HTTP 429).
//   - Hourly sliding-window quota per user and organization, by plan: Free 30, Starter 240,
//     Premium 600 requests per hour; user-specific endpoints such as /me 30 per hour (HTTP 402).
// The hourly quota depends on the customer's plan, so only the per-second rule is enforced here;
// the components keep their own request count low (cached pickers, throttled polling).
module.exports = {
    rules: [
        {
            limit: 1,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
