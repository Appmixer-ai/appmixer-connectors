'use strict';

const lib = require('../../lib');

/**
 * Component for deleting a conversation comment of an issue or a pull request.
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const { repositoryId, commentId } = context.messages.in.content;

        if (!repositoryId) {
            throw new context.CancelError('Repository is required!');
        }
        if (!commentId) {
            throw new context.CancelError('Comment ID is required!');
        }

        await lib.apiRequest(context, `repos/${repositoryId}/issues/comments/${commentId}`, {
            method: 'DELETE'
        });

        return context.sendJson({}, 'out');
    }
};
