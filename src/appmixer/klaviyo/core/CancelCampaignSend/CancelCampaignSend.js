module.exports = {

    async receive(context) {

        const { campaignId } = context.messages.in;

        const response = await context.httpRequest({
            method: 'PATCH',
            url: `https://a.klaviyo.com/api/campaigns/${campaignId}/send-job/`,
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
                        action: 'cancel'
                    }
                }
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
