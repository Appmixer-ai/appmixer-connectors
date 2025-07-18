module.exports = {
    async receive(context) {
        const { userId } = context.messages.in.content;
        
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Make API request
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://api.clerk.com/v1/users/${userId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            json: true
        });
        
        // Return the user details
        return context.sendJson(response.data, 'out');
    }
};
