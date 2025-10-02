'use strict';

module.exports = {
    async receive(context) {
        const { name, highlight, is_private } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Tag name is required.');
        }

        const requestData = { name };

        if (highlight !== undefined) requestData.highlight = highlight;
        if (typeof is_private === 'boolean') requestData.is_private = is_private;

        // API Documentation: https://dev.frontapp.com/reference/create-tag
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api2.frontapp.com/tags',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
