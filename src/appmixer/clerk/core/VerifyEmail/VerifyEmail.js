module.exports = {
    async receive(context) {
        const { emailId, code } = context.messages.in.content;
        
        if (!emailId) {
            throw new Error('Email ID is required');
        }
        
        // Prepare the request body
        const body = {};
        if (code) body.code = code;
        
        // Make API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.clerk.com/v1/email_addresses/${emailId}/verify`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body,
            json: true
        });
        
        // Return the result
        return context.sendJson(data, 'out');
    }
};
