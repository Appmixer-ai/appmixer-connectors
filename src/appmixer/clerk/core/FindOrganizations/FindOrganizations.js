
'use strict';

module.exports = {
    async receive(context) {
        const { limit = 10, offset = 0 } = context.messages.in.content;

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit);
        if (offset) queryParams.append('offset', offset);

        // Make API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Return the results
        return context.sendJson(data, 'out');
    }
};
