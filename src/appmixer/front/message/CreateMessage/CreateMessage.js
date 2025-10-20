'use strict';

module.exports = {
    async receive(context) {
        const {
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

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        if (!to || (Array.isArray(to) ? to.length === 0 : !to.trim())) {
            throw new context.CancelError('Recipients (to) are required.');
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

        // https://dev.frontapp.com/reference/create-message
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/channels/${channelId}/messages`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
