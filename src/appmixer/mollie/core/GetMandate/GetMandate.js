'use strict';

module.exports = {
    async receive(context) {

        const { customerId, mandateId } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer Id is required!');
        }

        if (!mandateId) {
            throw new context.CancelError('Mandate Id is required!');
        }

        // https://docs.mollie.com/reference/v2/mandates-api/get-mandate
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.mollie.com/v2/customers/${customerId}/mandates/${mandateId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
