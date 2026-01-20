'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { commentId } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required.');
        }

        await lib.apiRequest(context, `/comments/${commentId}`, {
            method: 'DELETE'
        });

        return context.sendJson({}, 'out');
    }
};
