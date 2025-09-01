'use strict';

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;

        // Validate required input
        if (!name || !name.trim()) {
            throw new context.CancelError('Tag Name is required');
        }

        const requestData = {
            name: name.trim()
        };


        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.kit.com/v4/tags',
            headers: {
                'X-Kit-Api-Key': context.auth.apiKey
            },
            data: requestData
        });

        return context.sendJson(data.tag, 'out');

    }
};
