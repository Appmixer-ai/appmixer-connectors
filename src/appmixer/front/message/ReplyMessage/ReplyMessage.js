'use strict';

module.exports = {
    async receive(context) {
        const {
            conversation_id,
            to,
            cc,
            bcc,
            subject,
            body,
            text,
            author_id,
            sender_name,
            attachments,
            reply_all
        } = context.messages.in.content;

        if (!conversation_id) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (!body && !text) {
            throw new context.CancelError('Message body or text is required.');
        }

        const requestData = {};

        if (to) {
            requestData.to = Array.isArray(to) ? to : to.split(',').map(email => email.trim());
        }

        if (cc) {
            requestData.cc = Array.isArray(cc) ? cc : cc.split(',').map(email => email.trim());
        }

        if (bcc) {
            requestData.bcc = Array.isArray(bcc) ? bcc : bcc.split(',').map(email => email.trim());
        }

        if (subject) requestData.subject = subject;
        if (body) requestData.body = body;
        if (text) requestData.text = text;
        if (author_id) requestData.author_id = author_id;
        if (sender_name) requestData.sender_name = sender_name;

        if (attachments) {
            requestData.attachments = Array.isArray(attachments)
                ? attachments
                : attachments.split(',').map(id => id.trim());
        }

        if (reply_all !== undefined) {
            requestData.options = { reply_all: reply_all };
        }

        // API Documentation: https://dev.frontapp.com/reference/create-message-reply
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/conversations/${conversation_id}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
