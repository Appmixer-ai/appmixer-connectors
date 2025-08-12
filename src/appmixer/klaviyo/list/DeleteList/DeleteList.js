'use strict';

module.exports = {

    async receive(context) {

        const { listId } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List ID is required!');
        }

        // https://developers.klaviyo.com/en/reference/delete_list
        await context.httpRequest({
            method: 'DELETE',
            url: `https://a.klaviyo.com/api/lists/${listId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            }
        });

        return context.sendJson({}, 'out');
    }
};
