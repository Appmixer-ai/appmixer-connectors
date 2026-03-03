'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const {
            locationId,
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

        if (!locationId) {
            throw new context.CancelError('Location ID is required!');
        }

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const body = {
            locationId,
            email
        };

        if (firstName) body.firstName = firstName;
        if (lastName) body.lastName = lastName;
        if (phone) body.phone = phone;
        if (address1) body.address1 = address1;
        if (city) body.city = city;
        if (state) body.state = state;
        if (postalCode) body.postalCode = postalCode;
        if (country) body.country = country;
        if (companyName) body.companyName = companyName;
        if (website) body.website = website;
        if (source) body.source = source;
        if (tags) {
            body.tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/contacts/`,
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
