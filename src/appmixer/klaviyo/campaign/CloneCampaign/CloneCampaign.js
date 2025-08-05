'use strict';

module.exports = {

    async receive(context) {

        const { campaignId, name } = context.messages.in.content;

        // Validate required fields
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Campaign name is required!');
        }

        const requestData = {
            data: {
                type: 'campaign',
                attributes: {
                    new_name: name
                },
                id: campaignId
            }
        };

        // https://developers.klaviyo.com/en/reference/create_campaign_clone
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/campaign-clone',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
