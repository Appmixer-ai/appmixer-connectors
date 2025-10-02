'use strict';

module.exports = {
    async receive(context) {
        const {
            channel_id,
            to,
            cc,
            bcc,
            subject,
            body,
            text,
            author_id,
            sender_name,
            attachments
        } = context.messages.in.content;

        if (!channel_id) {
            throw new context.CancelError('Channel ID is required.');
        }

        if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) {
            throw new context.CancelError('Recipients (to) are required.');
        }

        if (!body && !text) {
            throw new context.CancelError('Message body or text is required.');
        }

        const requestData = {
            to: Array.isArray(to) ? to : to.split(',').map(email => email.trim())
        };

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

        // API Documentation: https://dev.frontapp.com/reference/create-message
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/channels/${channel_id}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
