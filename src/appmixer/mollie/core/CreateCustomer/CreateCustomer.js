'use strict';

module.exports = {
    async receive(context) {

        const { name, email, locale, metadata, testmode } = context.messages.in.content;

        // Validate required field
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        // Build request data with provided parameters
        const data = {};
        data.name = name;
        if (email) data.email = email;
        if (locale) data.locale = locale;
        if (metadata) {
            // Handle metadata: parse if it's a string, otherwise use as-is
            if (typeof metadata === 'string') {
                try {
                    data.metadata = JSON.parse(metadata);
                } catch (e) {
                    throw new context.CancelError('Metadata must be a valid JSON object!');
                }
            } else {
                data.metadata = metadata;
            }
        }
        if (testmode !== undefined) data.testmode = testmode;

        // https://docs.mollie.com/reference/v2/customers-api/create-customer
        const response = await context.httpRequest({
            method: 'POST',
            url: 'https://api.mollie.com/v2/customers',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            },
            data
        });

        return context.sendJson(response.data, 'out');
    }
};
