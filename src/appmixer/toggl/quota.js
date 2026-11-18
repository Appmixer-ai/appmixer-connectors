'use strict';

// Toggl API limits (https://community.toggl.com/t/toggl-2-0-public-api/4434): an hourly quota
// by plan - Free 30, Starter 240, Premium 600 requests per hour. It depends on the customer's
// plan, so it is not enforced here; the rule below only keeps bursts from one flow apart, and
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
