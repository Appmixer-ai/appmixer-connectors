module.exports = {

    async receive(context) {

        const { listId } = context.messages.in;

        // https://developers.klaviyo.com/en/reference/get_list
        const response = await context.httpRequest({
            method: 'GET',
            url: `https://a.klaviyo.com/api/lists/${listId}/`,
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Revision': '2025-07-15'
            }
        });

        return context.sendJson(response.data, 'out');
    }
};
