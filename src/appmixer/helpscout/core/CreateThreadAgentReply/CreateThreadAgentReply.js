
'use strict';

module.exports = {
    async receive(context) {

        const {
            customerId,
            id,
            text,
            from,
            cc,
            bcc,
            draft
        } = context.messages.in.content;

        if (!customerId) {
            throw new context.CancelError('Customer ID is required!');
        }

        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!text) {
            throw new context.CancelError('Reply text is required!');
        }

        const requestBody = {
            customer: {
                id: parseInt(customerId)
            },
            text: text,
            draft: draft !== undefined ? draft : false
        };

        // Add optional fields if provided
        if (cc && cc.trim()) {
            // Parse comma-separated email addresses and convert to array
            requestBody.cc = cc.split(',')
                .map(email => email.trim())
                .filter(email => email.length > 0);
        }

        if (bcc && bcc.trim()) {
            // Parse comma-separated email addresses and convert to array
            requestBody.bcc = bcc.split(',')
                .map(email => email.trim())
                .filter(email => email.length > 0);
        }

        if (from && from.trim()) {
            requestBody.from = from.trim();
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/reply/
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.helpscout.net/v2/conversations/${id}/reply`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        // HelpScout Create Thread API returns empty body
        // Thread information is in response headers
        const result = {
            'Resource-ID': response.headers['resource-id'] || response.headers['Resource-ID'],
            'Date': response.headers['date'] || response.headers['Date']
        };

        return context.sendJson(result, 'out');
    }
};
