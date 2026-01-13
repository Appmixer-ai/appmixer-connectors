'use strict';

module.exports = {
    async receive(context) {

        const { listId } = context.messages.in.content;

        if (!listId) {
            throw new context.CancelError('List Id is required!');
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contact_Lists/deleteList
        await context.httpRequest({
            method: 'DELETE',
            url: `https://api.cc.email/v3/contact_lists/${listId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson({}, 'out');
    }
};
