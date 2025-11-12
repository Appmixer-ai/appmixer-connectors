'use strict';

module.exports = {

    async receive(context) {

        const { query, startTime, endTime } = context.messages.in.content;

        if (!query) {
            throw new context.CancelError('Query is required!');
        }

        const requestBody = { apl: query };

        if (startTime) {
            requestBody.startTime = startTime;
        }

        if (endTime) {
            requestBody.endTime = endTime;
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.axiom.co/v1/datasets/_apl',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
