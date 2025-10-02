'use strict';

module.exports = {
    async receive(context) {
        const { id, name, highlight, is_private } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Tag ID is required.');
        }

        const requestData = {};

        if (name !== undefined) requestData.name = name;
        if (highlight !== undefined) requestData.highlight = highlight;
        if (typeof is_private === 'boolean') requestData.is_private = is_private;

        // API Documentation: https://dev.frontapp.com/reference/update-a-tag
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/tags/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
