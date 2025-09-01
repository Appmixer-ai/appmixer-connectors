'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            name,
            slug,
            maxAllowedMemberships
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Organization ID is required');
        }

        // Prepare the request body
        const body = {};
        // Update properties if provided
        if (name !== undefined) body.name = name;
        if (slug !== undefined) body.slug = slug;
        if (maxAllowedMemberships !== undefined) body.max_allowed_memberships = maxAllowedMemberships;

        // Make API request
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api.clerk.com/v1/organizations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            },
            data: body
        });

        // Return the updated organization
        return context.sendJson({}, 'out');
    }
};
