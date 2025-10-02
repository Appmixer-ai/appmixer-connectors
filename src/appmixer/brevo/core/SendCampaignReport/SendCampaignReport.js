'use strict';

module.exports = {
    async receive(context) {
        const { campaignId, to, body } = context.messages.in.content;
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required');
        }

        if (!to) {
            throw new context.CancelError('Email is required');
        }

        if (!body) {
            throw new context.CancelError('Body is required');
        }


        // https://developers.brevo.com/reference/sendreport-1
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendReport`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            },
            data: {
                email: {
                    body,
                    to: to?.split(',')
                }
            }
        });

        return context.sendJson(data, 'out');
    }
};
