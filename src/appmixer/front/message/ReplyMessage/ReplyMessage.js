'use strict';

module.exports = {
    async receive(context) {
        const {
            conversationId,
            channelId,
            to,
            authorId,
            senderName,
            body,
            cc,
            bcc,
            subject,
            tags,
            archive
        } = context.messages.in.content;

        if (!conversationId) {
            throw new context.CancelError('Conversation ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Message body is required.');
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
        if (authorId) requestData.author_id = authorId;
        if (channelId) requestData.channel_id = channelId;
        if (senderName) requestData.sender_name = senderName;
        if (tags || archive !== undefined) {
            requestData.options = {};
            if (tags) {
                requestData.options.tag_ids = Array.isArray(tags) ? tags : tags.split(',').map(id => id.trim());
            }
            if (archive !== undefined) {
                requestData.options.archive = archive;
            }
        }

        // API Documentation: https://dev.frontapp.com/reference/create-message-reply
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/conversations/${conversationId}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
