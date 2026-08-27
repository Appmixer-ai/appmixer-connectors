'use strict';

module.exports = {

    async receive(context) {

        const { id, include } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required!');
        }

        const { domain, apiKey } = context.auth;
        const url = `https://${domain}/api/contacts/${id}`;

        const params = {};
        if (include) {
            params.include = include;
        }

        const response = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Token token=${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        return context.sendJson(response.data.contact, 'out');
    }
};
