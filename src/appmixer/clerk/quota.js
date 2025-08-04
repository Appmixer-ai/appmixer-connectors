module.exports = {
    rules: [
        {
            // For "Create users" endpoint: 20 requests per 10 seconds
            limit: 20,
            throttling: 'window-sliding',
            window: 1000 * 10,                 // 10 seconds in milliseconds
            // scope: 'userId',                   // Per user limits
            resource: 'users.create'           // Resource identifier for creating users
        },
        {
            // For all other endpoints: 100 requests per 10 seconds
            limit: 100,
            throttling: 'window-sliding',
            window: 1000 * 10,                 // 10 seconds in milliseconds
            // scope: 'userId',                   // Per user limits
            resource: 'requests'                // Default resource identifier for all other endpoints
        }
    ]
};
