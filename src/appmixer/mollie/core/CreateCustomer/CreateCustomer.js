'use strict';

module.exports = {
    async receive(context) {

        const { name, email, locale, metadata } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const data = {
            name,
            ...(email && { email }),
            ...(locale && { locale }),
            ...(metadata && { metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata })
        };

        // https://docs.mollie.com/reference/v2/customers-api/create-customer
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/json'
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
