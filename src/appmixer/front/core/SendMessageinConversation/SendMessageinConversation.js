
'use strict';

const lib = require('../../lib');

module.exports = {
    async receive(context) {

        const {
            id,
            type,
            subject,
            body,
            text,
            recipients,
            attachments
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required.');
        }
        if (!body) {
            throw new context.CancelError('Message body is required.');
        }

        const messageData = { body };

        if (type) messageData.type = type;
        if (subject) messageData.subject = subject;
        if (text) messageData.text = text;
        if (recipients && Array.isArray(recipients)) messageData.to = recipients;
        if (attachments && Array.isArray(attachments)) messageData.attachments = attachments;

        // https://dev.frontapp.com/reference
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/conversations/${id}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: messageData
        });

        return context.sendJson(data, 'out');
    }
};
