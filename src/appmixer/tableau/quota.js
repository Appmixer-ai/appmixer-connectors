'use strict';

// Tableau Cloud does not publish one general REST limit per user; its site capacity page lists
// hourly limits for specific job types only (extract refreshes, publishing, VizQL Data Service),
// and Tableau Server has no vendor quota at all. This rule keeps one account's flows from bursting.
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
