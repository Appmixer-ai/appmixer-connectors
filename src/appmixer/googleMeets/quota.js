module.exports = {
    rules: [
        {
            limit: 100,
            throttling: 'window-sliding',
            window: 1000 * 60, // 1 minute
            scope: 'userId',
            resource: 'meetings.api'
        },
        {
            limit: 1000,
            throttling: 'window-sliding',
            window: 1000 * 60 * 60, // 1 hour
            scope: 'userId',
            resource: 'meetings.api'
        }
    ]
};
