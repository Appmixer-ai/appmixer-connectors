'use strict';

module.exports = {

    async receive(context) {

        const { name, description } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Dataset name is required!');
        }

        const requestBody = { name };
        if (description) {
            requestBody.description = description;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.axiom.co/v1/datasets',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
