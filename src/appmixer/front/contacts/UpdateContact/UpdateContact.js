'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            name,
            description,
            links
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required.');
        }

        const updateData = {};

        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (links) {
            updateData.links = typeof links === 'string' ? links.split(',').map(s => s.trim()) : links;
        }

        // https://dev.frontapp.com/reference/update-a-contact
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: updateData
        });

        return context.sendJson({}, 'out');
    }
};
