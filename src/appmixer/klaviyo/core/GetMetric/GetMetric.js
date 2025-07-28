module.exports = {

    async receive(context) {

        const { metricId } = context.messages.in;

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/metrics/${metricId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Revision': '2025-07-15'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
