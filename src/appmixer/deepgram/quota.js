'use strict';

module.exports = {
    rules: [
        {
            // Audio Intelligence (REST) has the tightest project concurrency limit (~10).
            // Keep a conservative sliding window to reduce the chance of hitting 429s.
            limit: 100,
            window: 1000 * 60,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
