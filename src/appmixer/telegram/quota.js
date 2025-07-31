'use strict';

module.exports = {

    rules: [
        // Telegram Bot API has a limit of 30 messages per second
        {
            limit: 30,
            window: 1000, // 1 second
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};