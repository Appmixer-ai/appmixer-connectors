'use strict';

module.exports = {

    async receive(context) {

        const { id, include } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Deal ID is required!');
        }

        const params = {};
        if (include) {
            params.include = include;
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://${context.auth.domain}/api/deals/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params
        });

        return context.sendJson(data.deal, 'out');
    }
};
