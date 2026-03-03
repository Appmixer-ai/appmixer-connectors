'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const {
            contactId,
            firstName,
            lastName,
            email,
            phone,
            address1,
            city,
            state,
            postalCode,
            country,
            companyName,
            website,
            source,
            tags
        } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        const body = {};

        if (firstName !== undefined) body.firstName = firstName;
        if (lastName !== undefined) body.lastName = lastName;
        if (email !== undefined) body.email = email;
        if (phone !== undefined) body.phone = phone;
        if (address1 !== undefined) body.address1 = address1;
        if (city !== undefined) body.city = city;
        if (state !== undefined) body.state = state;
        if (postalCode !== undefined) body.postalCode = postalCode;
        if (country !== undefined) body.country = country;
        if (companyName !== undefined) body.companyName = companyName;
        if (website !== undefined) body.website = website;
        if (source !== undefined) body.source = source;
        if (tags !== undefined) {
            body.tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        const response = await context.httpRequest({
            method: 'PUT',
            url: `${BASE_URL}/contacts/${contactId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Version': API_VERSION
            },
            data: body
        });

        return context.sendJson(response.data.contact, 'out');
    }
};
