module.exports = {

    async receive(context) {

        const { campaignId, action } = context.messages.in.content;

        // Validate required fields
        if (!campaignId) {
            throw new context.CancelError('Campaign ID is required!');
        }

        if (!action) {
            throw new context.CancelError('Campaign action is required!');
        }

        // https://developers.klaviyo.com/en/reference/cancel_campaign_send
        await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/campaign-send-jobs/${campaignId}`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Revision': '2025-07-15'
            },
            data: {
                data: {
                    type: 'campaign-send-job',
                    id: campaignId,
                    attributes: {
                        action
                    }
                }
            }
        });

        return context.sendJson({}, 'out');
    }
};
