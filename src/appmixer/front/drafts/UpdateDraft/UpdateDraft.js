'use strict';

module.exports = {
    async receive(context) {
        const {
            draftId,
            channelId,
            to,
            authorId,
            body,
            cc,
            bcc,
            subject,
            version
        } = context.messages.in.content;

        if (!draftId) {
            throw new context.CancelError('Draft ID is required.');
        }

        if (!channelId) {
            throw new context.CancelError('Channel ID is required.');
        }

        if (!version) {
            throw new context.CancelError('Version is required.');
        }

        const requestData = {
            version,
            channel_id: channelId
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
        if (body) requestData.body = body;
        if (authorId) requestData.author_id = authorId;

        // https://dev.frontapp.com/reference/edit-draft
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/drafts/${draftId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestData
        });

        return context.sendJson({}, 'out');
    }
};
