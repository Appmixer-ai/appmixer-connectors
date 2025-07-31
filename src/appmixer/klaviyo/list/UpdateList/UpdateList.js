'use strict';

module.exports = {

    async receive(context) {

        const { listId, name } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List ID is required!');
        }

        if (!name) {
            throw new context.CancelError('List name is required!');
        }

        const requestData = {
            data: {
                type: 'list',
                id: listId,
                attributes: {
                    name
                }
            }
        };

        // https://developers.klaviyo.com/en/reference/update_list
        await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/lists/${listId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
