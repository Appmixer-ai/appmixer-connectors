'use strict';
module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Company ID is required!');
        }

        // https://developers.intercom.com/reference#retrieve-a-company
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.intercom.io/companies/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            }
        });

        return context.sendJson(data, 'out');
    }
};
