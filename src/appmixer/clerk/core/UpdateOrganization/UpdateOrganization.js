module.exports = {
    async receive(context) {
        const {
            organizationId,
            name,
            slug,
            maxAllowedMemberships,
            publicMetadata,
            privateMetadata
        } = context.messages.in.content;
        
        if (!organizationId) {
            throw new Error('Organization ID is required');
        }
        
        // Prepare the request body
        const body = {};
        
        // Update properties if provided
        if (name !== undefined) body.name = name;
        if (slug !== undefined) body.slug = slug;
        if (maxAllowedMemberships !== undefined) body.max_allowed_memberships = maxAllowedMemberships;
        if (publicMetadata !== undefined) body.public_metadata = publicMetadata;
        if (privateMetadata !== undefined) body.private_metadata = privateMetadata;
        
        // Make API request
        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.clerk.com/v1/organizations/${organizationId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: body,
            json: true
        });
        
        // Return the updated organization
        return context.sendJson(response, 'out');
    }
};
