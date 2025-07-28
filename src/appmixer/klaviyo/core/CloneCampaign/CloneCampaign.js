module.exports = {

    async receive(context) {

        const { campaignId, name } = context.messages.in;

        const requestData = {
            data: {
                type: 'campaign-clone',
                attributes: {}
            }
        };

        if (name) {
            requestData.data.attributes.name = name;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://a.klaviyo.com/api/campaigns/${campaignId}/clone/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Revision': '2025-07-15'
            },
            data: requestData
        });

        return context.sendJson(response.data, 'out');
    }
};
