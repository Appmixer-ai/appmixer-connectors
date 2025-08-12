'use strict';

module.exports = {

    async receive(context) {

        const { name } = context.messages.in.content;

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

        // https://developers.klaviyo.com/en/reference/create_list
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

        return context.sendJson(list, 'out');
    }
};
