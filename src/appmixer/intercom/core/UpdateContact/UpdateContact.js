/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const {
            id,
            external_id,
            role,
            email,
            phone,
            name,
            unsubscribed_from_emails,
            language_override
        } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Contact ID is required!');
        }

        // Build request body with only provided fields
        const requestBody = {};

        if (external_id) {
            requestBody.external_id = external_id;
        }

        if (role) {
            requestBody.role = role;
        }

        if (email) {
            requestBody.email = email;
        }

        if (phone) {
            requestBody.phone = phone;
        }

        if (name) {
            requestBody.name = name;
        }

        if (unsubscribed_from_emails !== undefined) {
            requestBody.unsubscribed_from_emails = unsubscribed_from_emails;
        }

        if (language_override) {
            requestBody.language_override = language_override;
        }

        // Make the API request
        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://api.intercom.io/contacts/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
