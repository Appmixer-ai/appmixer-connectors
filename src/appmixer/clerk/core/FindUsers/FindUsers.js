
'use strict';

module.exports = {
    async receive(context) {
        const { limit = 10, offset = 0, emailAddress, username, phoneNumber, userId } = context.messages.in.content;

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit);
        if (offset) queryParams.append('offset', offset);
        if (emailAddress) queryParams.append('email_address', emailAddress);
        if (username) queryParams.append('username', username);
        if (phoneNumber) queryParams.append('phone_number', phoneNumber);
        if (userId) queryParams.append('user_id', userId);

        // Make API request
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        // Return the results
        return context.sendJson(data, 'out');
    }
};
