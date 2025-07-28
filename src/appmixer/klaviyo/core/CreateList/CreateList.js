'use strict';

const lib = require('../../lib.generated');

module.exports = {

    async receive(context) {

        const { name, description } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('List name is required!');
        }

        const requestData = {
            data: {
                type: 'list',
                attributes: {
                    name
                }
            }
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/lists/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        const list = response.data.data;
        const outputData = {
            id: list.id,
            name: list.attributes.name,
            description: ''
        };

        return context.sendJson(outputData, 'out');
    }
};
