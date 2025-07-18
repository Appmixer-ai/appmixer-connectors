module.exports = {
    async receive(context) {
        const { organizationId } = context.messages.in.content;
        
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        
        // Make API request
        const response = await context.httpRequest({
            method: 'DELETE',
            url: `https://api.clerk.com/v1/organizations/${organizationId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            json: true
        });
        
        // Return the result
        return context.sendJson(response.data, 'out');
    }
};
