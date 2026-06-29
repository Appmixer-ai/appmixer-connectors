'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { email, firstName, lastName, company, title } = context.messages.in.content;

        if (!email) {
            throw new context.CancelError('Email is required!');
        }

        const prospect = { email };
        if (firstName) {
            prospect['first_name'] = firstName;
        }
        if (lastName) {
            prospect['last_name'] = lastName;
        }
        if (company) {
            prospect.company = company;
        }
        if (title) {
            prospect.title = title;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `${lib.API_BASE_URL}/v1/prospects`,
            headers: lib.getHeaders(context),
            data: { prospects: [prospect] }
        });

        return context.sendJson(response.data, 'out');
    }
};
