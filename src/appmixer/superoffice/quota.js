'use strict';

// SuperOffice asks apps to stay under 10 API calls per second per tenant
// (custom app validation checklist).
module.exports = {
    rules: [
        {
            limit: 10,
            window: 1000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
