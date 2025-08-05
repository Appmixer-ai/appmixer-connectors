'use strict';

module.exports = {

    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        // https://developers.klaviyo.com/en/reference/get_campaign
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/campaigns/${campaignId}/`,
            headers: {
                'Accept': 'application/vnd.api+json',
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Revision': '2025-07-15'
            }
        });

        return context.sendJson(data.data, 'out');
    }
};
