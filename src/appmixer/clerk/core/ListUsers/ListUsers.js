module.exports = {
    async receive(context) {
        const { limit = 10, offset = 0, emailAddress, username, phoneNumber, userId } = context.messages.in;
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (limit) queryParams.append('limit', limit);
        if (offset) queryParams.append('offset', offset);
        if (emailAddress) queryParams.append('email_address', emailAddress);
        if (username) queryParams.append('username', username);
        if (phoneNumber) queryParams.append('phone_number', phoneNumber);
        if (userId) queryParams.append('user_id', userId);
        
        // Make API request
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            json: true
        });
        
        // Return the results
        return context.sendJson({
            users: response.data,
            totalCount: response.total_count
        }, 'out');
    }
};
