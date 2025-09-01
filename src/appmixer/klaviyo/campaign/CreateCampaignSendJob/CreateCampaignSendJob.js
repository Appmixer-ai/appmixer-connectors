'use strict';

module.exports = {

    async receive(context) {

        const { campaignId } = context.messages.in.content;

        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        const requestData = {
            data: {
                type: 'campaign-send-job',
                id: campaignId
            }
        };

        // https://developers.klaviyo.com/en/reference/send_campaign
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://a.klaviyo.com/api/campaign-send-jobs',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
