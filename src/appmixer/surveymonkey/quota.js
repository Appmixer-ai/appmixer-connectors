'use strict';

// Draft and private SurveyMonkey apps may make 120 requests per minute and 500 per day
// (public_api_docs, _overview.md, "Request and Response Limits"); published public apps are
// unlimited. The daily allowance belongs to the app, not to a user, so it cannot be enforced
// here; the per-minute rule keeps one user under the app's minute limit.
module.exports = {
    rules: [
        {
            limit: 120,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
