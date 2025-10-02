'use strict';

module.exports = {
    async receive(context) {
        const { campaignId } = context.messages.in.content;
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required');
        }


        // https://developers.brevo.com/reference/getemailcampaign
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://api.brevo.com/v3/emailCampaigns/${campaignId}`,
            headers: {
                'api-key': `${context.auth.apiKey}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
