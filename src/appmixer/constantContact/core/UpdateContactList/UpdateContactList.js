'use strict';

module.exports = {
    async receive(context) {

        const { listId, name, favorite } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List Id is required!');
        }

        const requestData = {};
        if (name !== undefined) {
            requestData.name = name;
        }
        if (favorite !== undefined) {
            requestData.favorite = favorite;
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contact_Lists/putList
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.cc.email/v3/contact_lists/${listId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
