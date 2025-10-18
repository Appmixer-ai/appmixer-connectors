'use strict';

module.exports = {
    async receive(context) {
        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required');
        }

        // https://developers.brevo.com/reference/sendemailcampaignnow-1
        await context.httpRequest({
            method: 'POST',
            url: `https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`,
            headers: {
                'api-key': `${context.auth.apiKey}`,
                'accept': 'application/json'
            }
        });

        return context.sendJson({}, 'out');
    }
};
