
'use strict';

module.exports = {
    async receive(context) {

        const {
            id,
            status,
            assignToId,
            assignToType,
            tags
        } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required!');
        }

        const requestBody = {};

        // Add fields to update if provided
        if (status) {
            requestBody.status = status;
        }

        if (assignToId) {
            requestBody.assignTo = {
                id: parseInt(assignToId),
                type: assignToType || 'user'
            };
        }

        if (tags && Array.isArray(tags)) {
            requestBody.tags = tags;
        }

        // Only make request if there are fields to update
        if (Object.keys(requestBody).length === 0) {
            throw new context.CancelError('At least one field must be provided to update!');
        }

        // https://developer.helpscout.com/mailbox-api/endpoints/conversations/update/
        console.log('UpdateConversation request body:', JSON.stringify(requestBody, null, 2));

        const { data } = await context.httpRequest({
            method: 'PATCH',
            url: `https://api.helpscout.net/v2/conversations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
