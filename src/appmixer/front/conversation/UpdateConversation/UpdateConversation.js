'use strict';

module.exports = {
    async receive(context) {

        const { id, status, assigneeId, inboxId } = context.messages.in.content;

        if (!id) {
            throw new context.CancelError('Conversation ID is required.');
        }

        const body = {};

        if (status) {
            body.status = status;
        }

        if (assigneeId) {
            body.assignee_id = assigneeId;
        }

        if (inboxId) {
            body.inbox_id = inboxId;
        }

        // https://dev.frontapp.com/reference/update-conversation
        await context.httpRequest({
            method: 'PATCH',
            url: `https://api2.frontapp.com/conversations/${id}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
