module.exports = {

    async receive(context) {

        const { listId, pageSize = 20 } = context.messages.in;

        const response = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/lists/${listId}/profiles/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Revision': '2025-07-15'
            },
            params: {
                'page[size]': pageSize
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
