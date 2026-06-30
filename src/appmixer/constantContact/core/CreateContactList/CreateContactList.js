'use strict';

module.exports = {
    async receive(context) {

        const { name, favorite } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        // https://v3.developer.constantcontact.com/api_reference/index.html#!/Contact_Lists/createList
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.cc.email/v3/contact_lists',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: {
                name,
                favorite
            }
        });

        return context.sendJson(data, 'out');
    }
};
