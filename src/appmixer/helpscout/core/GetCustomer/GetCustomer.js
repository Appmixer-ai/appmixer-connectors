
'use strict';

module.exports = {
    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Customer ID is required.');
        }
        // https://developer.helpscout.com/mailbox-api/endpoints/customers/get/
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.helpscout.net/v2/customers/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');

    }
};
