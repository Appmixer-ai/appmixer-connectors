'use strict';

// RoomPriceGenie documents no rate limit (https://postman.roompricegenie.com/). The rule below is a
// cautious default of this connector, not a number of the vendor: 5 requests a second per user.
// The triggers make no request and are not counted.
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
