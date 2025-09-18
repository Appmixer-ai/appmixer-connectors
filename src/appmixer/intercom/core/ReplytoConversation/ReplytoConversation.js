/* eslint-disable camelcase */
'use strict';

module.exports = {

    async receive(context) {

        const {
            id,
            reply_type,
            intercom_user_id,
            email,
            user_id,
            admin_id,
            message_type,
            body
        } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!reply_type) {
            throw new context.CancelError('Reply Type is required!');
        }

        let requestBody = {};

        if (reply_type === 'contact') {
            // Contact reply validation and construction

            // Check that at least one contact identifier is provided
            if (!intercom_user_id && !email && !user_id) {
                throw new context.CancelError('For contact replies, at least one contact identifier is required (intercom_user_id, email, or user_id)!');
            }

            // Body is always required for contact replies
            if (!body) {
                throw new context.CancelError('Body is required for contact replies!');
            }

            // Set required fields for contact replies
            requestBody.message_type = 'comment';
            requestBody.type = 'user';
            requestBody.body = body;

            // Set the contact identifier (prioritize in order: intercom_user_id, email, user_id)
            if (intercom_user_id) {
                requestBody.intercom_user_id = intercom_user_id;
            } else if (email) {
                requestBody.email = email;
            } else if (user_id) {
                requestBody.user_id = user_id;
            }

        } else if (reply_type === 'admin') {
            // Admin reply validation and construction

            if (!admin_id) {
                throw new context.CancelError('Admin ID is required for admin replies!');
            }

            if (!message_type) {
                throw new context.CancelError('Message Type is required for admin replies!');
            }

            // Set required fields for admin replies
            requestBody.type = 'admin';
            requestBody.admin_id = admin_id;
            requestBody.message_type = message_type;

            // Body is required for comment and note, but not for quick_reply
            if (message_type === 'comment' || message_type === 'note') {
                if (!body) {
                    throw new context.CancelError(`Body is required for ${message_type} message type!`);
                }
                requestBody.body = body;
            }

        } else {
            throw new context.CancelError('Reply Type must be either "contact" or "admin"!');
        }

        // Make the API request
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.intercom.io/conversations/${id}/reply`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14',
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
