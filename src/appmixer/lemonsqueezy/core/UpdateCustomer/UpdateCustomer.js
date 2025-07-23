'use strict';

module.exports = {

    async receive(context) {

        const { customerId, name, email, city, region, country, status } = context.messages.in.content;

        // Build the request data
        const requestData = {
            data: {
                type: 'customers',
                id: customerId,
                attributes: {}
            }
        };

        // Add only the fields that are provided
        if (name) {
            requestData.data.attributes.name = name;
        }
        if (email) {
            requestData.data.attributes.email = email;
        }
        if (city) {
            requestData.data.attributes.city = city;
        }
        if (region) {
            requestData.data.attributes.region = region;
        }
        if (country) {
            requestData.data.attributes.country = country;
        }
        if (status) {
            requestData.data.attributes.status = status;
        }

        // https://docs.lemonsqueezy.com/api/customers/update-customer
        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
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
