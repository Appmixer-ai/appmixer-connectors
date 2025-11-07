'use strict';

module.exports = {
    async receive(context) {
        const { orderId, lines, tracking, testmode } = context.messages.in.content;

        if (!orderId) {
            throw new context.CancelError('Order ID is required!');
        }

        if (!lines || lines.length === 0) {
            throw new context.CancelError('Lines is required!');
        }

        const requestData = {
            lines: lines
        };

        if (tracking) {
            requestData.tracking = tracking;
        }

        if (testmode) {
            requestData.testmode = testmode;
        }

        // https://docs.mollie.com/reference/v2/shipments-api/create-shipment
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.mollie.com/v2/orders/${orderId}/shipments`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
