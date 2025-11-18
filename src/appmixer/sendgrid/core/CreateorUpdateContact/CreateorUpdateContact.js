'use strict';

module.exports = {
    async receive(context) {
        const {
            email,
            first_name,
            last_name,
            address_line_1,
            address_line_2,
            city,
            state_province_region,
            postal_code,
            country,
            custom_fields,
            list_ids
        } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        // Build contact object with provided fields
        const contact = {
            email
        };

        if (first_name) {
            contact.first_name = first_name;
        }
        if (last_name) {
            contact.last_name = last_name;
        }
        if (address_line_1) {
            contact.address_line_1 = address_line_1;
        }
        if (address_line_2) {
            contact.address_line_2 = address_line_2;
        }
        if (city) {
            contact.city = city;
        }
        if (state_province_region) {
            contact.state_province_region = state_province_region;
        }
        if (postal_code) {
            contact.postal_code = postal_code;
        }
        if (country) {
            contact.country = country;
        }
        if (custom_fields && typeof custom_fields === 'object') {
            contact.custom_fields = custom_fields;
        }

        const requestBody = {
            contacts: [contact]
        };

        if (list_ids && Array.isArray(list_ids) && list_ids.length > 0) {
            requestBody.list_ids = list_ids;
        }

        // https://www.twilio.com/docs/sendgrid/api-reference/contacts/add-or-update-a-contact
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: 'https://api.sendgrid.com/v3/marketing/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
