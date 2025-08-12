'use strict';

module.exports = {
    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://developers.mailerlite.com/docs/campaigns.html#get-a-campaign
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://connect.mailerlite.com/api/campaigns/${campaignId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
