'use strict';

module.exports = {
    async receive(context) {

        const { date } = context.messages.in.content;

        if (!date) {
            throw new context.CancelError('Date is required.');
        }

        if (!/^\d{8}$/.test(String(date))) {
            throw new context.CancelError('Date must be in YYYYMMDD format!');
        }

        // https://developers.line.biz/en/reference/messaging-api/#get-number-of-message-deliveries
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.line.me/v2/bot/insight/message/delivery',
            headers: {
                'Authorization': `Bearer ${context.auth.channelAccessToken}`
            },
            params: {
                date
            }
        });

        return context.sendJson(data, 'out');
    }
};
