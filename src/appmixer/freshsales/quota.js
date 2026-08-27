'use strict';

module.exports = {

    rules: [
        // https://crmsupport.freshworks.com/support/solutions/articles/50000010517-api-limits-for-sales-and-support-products-in-freshworks
        // Freshsales API limits per agent (hourly): Free/Growth: 1000, Pro: 2000, Enterprise: 5000
        // Using the lowest tier (Free/Growth) as the default
        {
            limit: 1000,
            window: 1000 * 60 * 60, // 1 hour
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
