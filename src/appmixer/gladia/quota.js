'use strict';

// Gladia does not publish a hard per-minute request ceiling, so we throttle
// conservatively and queue overflow so flows degrade gracefully instead of
// hitting rate-limit errors.
module.exports = {

    rules: [
        {
            limit: 60,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests',
            scope: 'userId'
        }
    ]
};
