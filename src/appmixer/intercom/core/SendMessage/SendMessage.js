/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const {
            message_type,
            body,
            subject,
            template,
            from_admin_id,
            to_contact_id,
            to_contact_type = 'user',
            create_conversation_without_contact_reply
        } = context.messages.in.content;

        // Validate required fields
        if (!message_type) {
            throw new context.CancelError('Message Type is required!');
        }

        if (!body) {
            throw new context.CancelError('Body is required!');
        }

        if (!to_contact_id) {
            throw new context.CancelError('To Contact ID is required!');
        }

        if (!from_admin_id) {
            throw new context.CancelError('From Admin ID is required!');
        }

        // For email messages, subject and template are required
        if (message_type === 'email') {
            if (!subject) {
                throw new context.CancelError('Subject is required for email messages!');
            }
            if (!template) {
                throw new context.CancelError('Template is required for email messages!');
            }
        }

        // Build the request body according to API documentation
        const requestBody = {
            message_type: message_type,
            body: body,
            to: {
                type: to_contact_type,
                id: to_contact_id
            },
            from: {
                type: 'admin',
                id: from_admin_id
            }
        };

        // Add conditional fields based on message type
        if (subject) {
            requestBody.subject = subject;
        }

        if (template) {
            requestBody.template = template;
        }

        if (create_conversation_without_contact_reply !== undefined) {
            requestBody.create_conversation_without_contact_reply = create_conversation_without_contact_reply;
        }

        // Make the API request https://developers.intercom.com/docs/references/rest-api/api.intercom.io/messages/createmessage
        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.intercom.io/messages',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
