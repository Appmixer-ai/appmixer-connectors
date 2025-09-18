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
            created_at,
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

        // For email messages, subject is required
        if (message_type === 'email' && !subject) {
            throw new context.CancelError('Subject is required for email messages!');
        }

        // Build the request body
        const requestBody = {
            message_type: message_type,
            body: body,
            to: {
                type: 'user',
                id: to_contact_id
            }
        };

        // Add optional fields if provided
        if (subject) {
            requestBody.subject = subject;
        }

        if (template) {
            requestBody.template = template;
        }

        if (from_admin_id) {
            requestBody.from = {
                type: 'admin',
                id: from_admin_id
            };
        }

        if (created_at) {
            requestBody.created_at = created_at;
        }

        if (create_conversation_without_contact_reply !== undefined) {
            requestBody.create_conversation_without_contact_reply = create_conversation_without_contact_reply;
        }

        // Make the API request
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
