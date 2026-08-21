'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const { phoneNumber, phoneType } = content;

        // Cliniko has no single mandatory field here, but a contact with no name at all is
        // unusable - catch it before the API turns it into an opaque 422.
        if (!content.firstName && !content.lastName && !content.companyName) {
            throw new context.CancelError('At least one of First Name, Last Name or Company Name is required!');
        }

        const body = lib.clean({
            first_name: content.firstName,
            last_name: content.lastName,
            preferred_name: content.preferredName,
            company_name: content.companyName,
            title: content.title,
            email: content.email,
            type_code: content.typeCode,
            doctor_type: content.doctorType,
            provider_number: content.providerNumber,
            occupation: content.occupation,
            address_1: content.address1,
            address_2: content.address2,
            address_3: content.address3,
            city: content.city,
            state: content.state,
            post_code: content.postCode,
            country_code: content.countryCode,
            notes: content.notes
        });

        if (phoneNumber) {
            body.phone_numbers = [{ number: phoneNumber, phone_type: phoneType || 'Work' }];
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/contacts',
            headers: { 'Content-Type': 'application/json' },
            data: body
        });

        return context.sendJson(data, 'out');
    }
};
