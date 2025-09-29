
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            text,
            from,
            cc,
            bcc,
            attachmentIds,
            draft
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!text) {
            throw new context.CancelError('Reply text is required!');
        }

        const requestBody = {
            text,
            type: 'reply'
        };

        // Add optional fields if provided
        if (from) requestBody.from = from;
        if (cc) requestBody.cc = cc;
        if (bcc) requestBody.bcc = bcc;
        if (draft !== undefined) requestBody.draft = draft;
        if (attachmentIds && Array.isArray(attachmentIds)) {
            requestBody.attachments = attachmentIds.map(id => ({ id }));
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/reply/
        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.helpscout.net/v2/conversations/${id}/reply`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
