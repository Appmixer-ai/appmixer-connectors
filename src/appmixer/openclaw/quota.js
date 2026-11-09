'use strict';

// OpenClaw documents no request rate limit for its hooks; it only throttles failed
// authentication (429 after 20 failures a minute). Every call here starts work on the
// gateway owner's agents, so this caps how fast one user can hand runs over.
module.exports = {
    rules: [
        {
            limit: 30,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
