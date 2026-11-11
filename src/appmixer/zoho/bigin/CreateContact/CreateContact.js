'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const {
            firstName, lastName, email, phone, mobile, title, companyId, description,
            mailingStreet, mailingCity, mailingState, mailingZip, mailingCountry
        } = context.messages.in.content;

        if (!lastName) {
            throw new context.CancelError('Last Name is required!');
        }

        const record = {
            First_Name: firstName,
            Last_Name: lastName,
            Email: email,
            Phone: phone,
            Mobile: mobile,
            Title: title,
            Account_Name: companyId ? { id: String(companyId) } : undefined,
            Description: description,
            Mailing_Street: mailingStreet,
            Mailing_City: mailingCity,
            Mailing_State: mailingState,
            Mailing_Zip: mailingZip,
            Mailing_Country: mailingCountry
        };
        Object.keys(record).forEach(key => (record[key] === undefined || record[key] === '') && delete record[key]);

        const details = await lib.createRecord(context, 'Contacts', record);
        return context.sendJson(details, 'out');
    }
};
