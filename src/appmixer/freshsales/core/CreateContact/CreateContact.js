'use strict';

module.exports = {
    async receive(context) {

        const {
            first_name: firstName,
            last_name: lastName,
            email,
            mobile_number: mobileNumber,
            work_number: workNumber,
            job_title: jobTitle,
            website,
            address,
            city,
            state,
            country,
            zipcode,
            custom_field: customField,
            sales_accounts: salesAccounts,
            tags
        } = context.messages.in.content;

        // Build the contact object
        const contactData = {
            first_name: firstName,
            last_name: lastName,
            email,
            mobile_number: mobileNumber,
            work_number: workNumber,
            job_title: jobTitle,
            website,
            address,
            city,
            state,
            country,
            zipcode,
            custom_field: customField
        };

        // Remove undefined/null values
        Object.keys(contactData).forEach(key => {
            if (contactData[key] === undefined || contactData[key] === null) {
                delete contactData[key];
            }
        });

        // Add optional array fields if provided
        if (salesAccounts) {
            contactData.sales_accounts = salesAccounts;
        }
        if (tags) {
            contactData.tags = tags;
        }

        const { domain, apiKey } = context.auth;

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://${domain}/api/contacts`,
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
