module.exports = {

    async receive(context) {

        const { pageSize = 20, filter } = context.messages.in;

        const params = {
            'page[size]': pageSize
        };

        if (filter) {
            params.filter = filter;
        }

        const response = await context.httpRequest({
            method: 'GET',
            url: 'https://a.klaviyo.com/api/profiles/',
            headers: {
                'Authorization': `Klaviyo-API-Key ${context.auth.apiKey}`,
                'Accept': 'application/json',
                'Revision': '2025-07-15'
            },
            params: params
        });

        return context.sendJson(response.data, 'out');
    }
};
