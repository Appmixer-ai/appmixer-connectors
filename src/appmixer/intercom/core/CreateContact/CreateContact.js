/* eslint-disable camelcase */

'use strict';

module.exports = {

    async receive(context) {

        const { phone, email, name, external_id, role } = context.messages.in.content;

        if (!email && !external_id) {
            throw new context.CancelError('Either email or external_id is required!');
        }

        const requestBody = {};

        if (email) {
            requestBody.email = email;
        }

        if (name) {
            requestBody.name = name;
        }

        if (external_id) {
            requestBody.external_id = external_id;
        }

        if (phone) {
            requestBody.phone = phone;
        }

        if (role) {
            requestBody.role = role;
        }


        // https://developers.intercom.com/docs/references/rest-api/api.intercom.io/contacts/createcontact
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
