'use strict';

module.exports = {

    async receive(context) {

        const { invoiceId } = context.messages.in.content;

        if (!invoiceId) {
            throw new context.CancelError('Invoice ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.harvestapp.com/v2/invoices/${invoiceId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Harvest-Account-Id': context.auth.accountId,
                'User-Agent': 'Appmixer (info@appmixer.ai)'
            }
        });

        return context.sendJson(data, 'out');
    }
};
