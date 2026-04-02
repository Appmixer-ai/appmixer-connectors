'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            first_name: firstName,
            last_name: lastName,
            email,
            mobile_number: mobileNumber,
            work_number: workNumber,
            job_title: jobTitle,
            address,
            city,
            state,
            country,
            zipcode,
            time_zone: timeZone,
            keyword,
            medium,
            facebook,
            twitter,
            linkedin
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Contact ID is required!');
        }

        const contactData = {
            first_name: firstName, last_name: lastName, email,
            mobile_number: mobileNumber, work_number: workNumber,
            job_title: jobTitle, address, city, state, country, zipcode,
            time_zone: timeZone, keyword, medium, facebook, twitter, linkedin
        };

        // Remove undefined/null/empty values
        Object.keys(contactData).forEach(key => {
            if (contactData[key] === undefined || contactData[key] === null || contactData[key] === '') {
                delete contactData[key];
            }
        });

        const { domain, apiKey } = context.auth;

        const response = await context.httpRequest({
            method: 'PUT',
            url: `https://${domain}/api/contacts/${id}`,
            headers: {
                'Authorization': `Token token=${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: {
                contact: contactData
            }
        });

        return context.sendJson(response.data.contact, 'out');
    }
};
