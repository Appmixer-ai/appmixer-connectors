'use strict';

module.exports = {

    async receive(context) {

        const { conversionKey, data } = context.messages.in.content;

        if (!conversionKey) {
            throw new context.CancelError('Conversion Key is required!');
        }

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

        const baseUrl = context.auth.baseUrl.replace(/\/$/, '');
        const response = await context.httpRequest({
            method: 'POST',
            url: `${baseUrl}/Flows/Home/HubsStartWithData?clientKey=${encodeURIComponent(context.auth.clientKey)}&conversionKey=${encodeURIComponent(conversionKey)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: parsedData
        });

        return context.sendJson(response.data || {}, 'out');
    }
};
