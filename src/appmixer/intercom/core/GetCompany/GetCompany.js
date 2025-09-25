'use strict';
module.exports = {

    async receive(context) {

        const { id } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Company ID is required!');
        }

        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/companies/retrievecompany
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
