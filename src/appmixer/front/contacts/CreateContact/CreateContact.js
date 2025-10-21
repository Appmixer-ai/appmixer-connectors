'use strict';

module.exports = {
    async receive(context) {
        const {
            name,
            description,
            links,
            handles
        } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required.');
        }

        const requestData = { name };

        if (description) {
            requestData.description = description;
        }

        if (links) {
            requestData.links = Array.isArray(links) ? links : links.split(',').map(link => link.trim());
        }

        if (handles) {
            const transformedHandles = handles.ADD.map(handle => ({
                source: handle.source,
                handle: handle.handle
            }));
            requestData.handles = transformedHandles;
        }

        // https://dev.frontapp.com/reference/create-contact
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api2.frontapp.com/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
