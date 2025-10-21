'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required.');
        }

        // https://dev.frontapp.com/reference/get-contact
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api2.frontapp.com/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');

    }
};
