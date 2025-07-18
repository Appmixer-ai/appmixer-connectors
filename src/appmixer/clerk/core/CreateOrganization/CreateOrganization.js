module.exports = {
    async receive(context) {
        const { name, slug, maxAllowedMemberships, publicMetadata, privateMetadata } = context.messages.in.content;
        
        // Prepare the request body
        const body = {};
        
        if (name) body.name = name;
        if (slug) body.slug = slug;
        if (maxAllowedMemberships) body.max_allowed_memberships = maxAllowedMemberships;
        if (publicMetadata) body.public_metadata = publicMetadata;
        if (privateMetadata) body.private_metadata = privateMetadata;
        
        // Make API request
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.clerk.com/v1/organizations',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body,
            json: true
        });
        
        // Return the created organization
        return context.sendJson(response.data, 'out');
    }
};
