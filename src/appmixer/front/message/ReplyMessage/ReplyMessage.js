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

        const requestData = {};
        const normalizeListInput = value => {
            if (!value) {
                return [];
            }

            const values = Array.isArray(value)
                ? value
                : value.split(',').map(item => item.trim());

            return values.filter(item => item && item.length > 0);
        };

        const normalizedTo = normalizeListInput(to);
        if (normalizedTo.length > 0) {
            requestData.to = normalizedTo;
        }

        const normalizedCc = normalizeListInput(cc);
        if (normalizedCc.length > 0) {
            requestData.cc = normalizedCc;
        }

        const normalizedBcc = normalizeListInput(bcc);
        if (normalizedBcc.length > 0) {
            requestData.bcc = normalizedBcc;
        }

        if (subject) requestData.subject = subject;
        if (body) requestData.body = body;
        if (authorId) requestData.author_id = authorId;
        if (channelId) requestData.channel_id = channelId;
        if (senderName) requestData.sender_name = senderName;
        if (tags || archive !== undefined) {
            requestData.options = {};
            const normalizedTags = normalizeListInput(tags);
            if (normalizedTags.length > 0) {
                requestData.options.tag_ids = normalizedTags;
            }
            if (archive !== undefined) {
                requestData.options.archive = archive;
            }
            if (Object.keys(requestData.options).length === 0) {
                delete requestData.options;
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
