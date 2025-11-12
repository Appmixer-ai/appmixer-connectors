'use strict';

module.exports = {
    async receive(context) {

        const { start, end } = context.messages.in.content;

        if (!start) {
            throw new context.CancelError('Start is required!');
        }

        if (!end) {
            throw new context.CancelError('End is required!');
        }

        // https://developers.amplitude.com/docs/export-api
        const credentials = `${context.auth.apiKey}:${context.auth.secretKey}`;
        const encodedCredentials = Buffer.from(credentials).toString('base64');

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://amplitude.com/api/2/export',
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json'
            },
            params: {
                start: start,
                end: end
            }
        });

        return context.sendJson(data, 'out');
    }
};
