'use strict';

module.exports = {
    async receive(context) {

        const { balanceId } = context.messages.in.content;

        if (!balanceId) {
            throw new context.CancelError('Balance ID is required!');
        }

        // https://docs.mollie.com/reference/v2/balances-api/get-balance
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/balances/${balanceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
