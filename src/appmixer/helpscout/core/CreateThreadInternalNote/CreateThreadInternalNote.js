
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            text,
            status,
            imported
        } = context.messages.in.content;

        // Validate required fields
        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        if (!text || !text.trim()) {
            throw new context.CancelError('Note text is required!');
        }

        // Build the request body
        const requestBody = {
            text: text.trim()
        };

        // Add optional fields if provided
        if (status && status.trim()) {
            requestBody.status = status.trim();
        }

        if (imported !== undefined) {
            requestBody.imported = imported;
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/notes/
        const response = await context.httpRequest({
            method: 'POST',
            url: `https://api.helpscout.net/v2/conversations/${id}/notes`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: requestBody
        });

        // HelpScout Create Note API returns empty body with thread ID in headers
        const result = {
            'Resource-ID': response.headers['resource-id'] || response.headers['Resource-ID'],
            'Date': response.headers['date'] || response.headers['Date']
        };

        return context.sendJson(result, 'out');
    }
};
