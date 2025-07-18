module.exports = {
    async receive(context) {
        const {
            userId,
            firstName,
            lastName,
            username,
            publicMetadata,
            privateMetadata
        } = context.messages.in.content;
        
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Prepare the request body
        const body = {};
        
        // Update properties if provided
        if (firstName !== undefined) body.first_name = firstName;
        if (lastName !== undefined) body.last_name = lastName;
        if (username !== undefined) body.username = username;
        if (publicMetadata !== undefined) body.public_metadata = publicMetadata;
        if (privateMetadata !== undefined) body.private_metadata = privateMetadata;
        
        // Make API request
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.clerk.com/v1/users/${userId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body,
            json: true
        });
        
        // Return the updated user
        return context.sendJson(response.data, 'out');
    }
};
