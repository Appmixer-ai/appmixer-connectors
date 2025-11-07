'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const { settlementId } = context.messages.in.content;

        if (!settlementId) {
            throw new context.CancelError('Settlement Id is required!');
        }

        // https://docs.mollie.com/reference/v2/settlements-api/get-settlement
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/settlements/${settlementId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
