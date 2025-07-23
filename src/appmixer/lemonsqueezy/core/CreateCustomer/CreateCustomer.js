'use strict';

module.exports = {

    async receive(context) {
        const { storeId, name, email, city, region, country } = context.messages.in.content;

        // Validate required fields
        if (!storeId) {
            throw new context.CancelError('Store ID is required');
        }
        if (!name) {
            throw new context.CancelError('Customer name is required');
        }
        if (!email) {
            throw new context.CancelError('Customer email is required');
        }

        // Build the request data
        const requestData = {
            data: {
                type: 'customers',
                attributes: {
                    name,
                    email
                },
                relationships: {
                    store: {
                        data: {
                            type: 'stores',
                            id: storeId
                        }
                    }
                }
            }
        };

        // Add optional fields if provided
        if (city) {
            requestData.data.attributes.city = city;
        }
        if (region) {
            requestData.data.attributes.region = region;
        }
        if (country) {
            requestData.data.attributes.country = country;
        }

        // https://docs.lemonsqueezy.com/api/customers/create-customer
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.lemonsqueezy.com/v1/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            data: requestData
        });

        return context.sendJson(data.data, 'out');
    }
};
