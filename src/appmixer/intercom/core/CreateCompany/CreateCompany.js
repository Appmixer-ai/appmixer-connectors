/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const { company_id, name, custom_attributes } = context.messages.in.content;

        if (!company_id) {
            throw new context.CancelError('Company ID is required!');
        }

        const requestBody = {
            company_id: company_id
        };

        if (name) {
            requestBody.name = name;
        }

        if (custom_attributes) {
            try {
                requestBody.custom_attributes = typeof custom_attributes === 'string'
                    ? JSON.parse(custom_attributes)
                    : custom_attributes;
            } catch (error) {
                throw new context.CancelError('Invalid custom attributes format. Must be valid JSON.');
            }
        }

        // https://developers.intercom.com/reference#create-a-company
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/companies',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
