'use strict';

module.exports = {
    async receive(context) {
        const {
            channelId,
            to,
            authorId,
            body,
            cc,
            bcc,
            subject
        } = context.messages.in.content;

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        if (!body) {
            throw new context.CancelError('Message body is required.');
        }

        const requestData = {
            body
        };

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
        if (authorId) requestData.author_id = authorId;

        // https://dev.frontapp.com/reference/create-draft
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api2.frontapp.com/channels/${channelId}/drafts`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson(data, 'out');
    }
};
