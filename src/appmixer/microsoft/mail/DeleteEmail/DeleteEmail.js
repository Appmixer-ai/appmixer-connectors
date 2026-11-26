'use strict';

const { makeRequest } = require('../commons');

module.exports = {

    async receive(context) {

        const { messageId } = context.messages.in.content;

        if (!messageId) {
            throw new context.CancelError('Message ID is required!');
        }

        // Moves the message to the Deleted Items folder.
        await makeRequest(context, {
            path: `/me/messages/${encodeURIComponent(messageId)}`,
            method: 'DELETE'
        });

        return await context.sendJson({}, 'out');
    }
};
