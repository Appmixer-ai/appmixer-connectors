'use strict';

module.exports = {
    async receive(context) {

        const { id, format } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Cohort ID is required!');
        }

        // https://developers.amplitude.com/docs/behavioral-cohorts-api#download-cohort
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://amplitude.com/api/5/cohorts/request/${id}`,
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            params: format ? { format } : {}
        });

        return context.sendJson(data, 'out');
    }
};
