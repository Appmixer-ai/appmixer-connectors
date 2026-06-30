'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { commentId, content } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required.');
        }

        if (!content) {
            throw new context.CancelError('Content is required.');
        }

        const comment = await lib.apiRequest(context, `/comments/${commentId}`, {
            method: 'POST',
            data: { content }
        });

        return context.sendJson(comment, 'out');
    }
};
