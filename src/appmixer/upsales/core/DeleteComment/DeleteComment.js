'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { commentId } = context.messages.in.content;

        if (!commentId) {
            throw new context.CancelError('Comment ID is required!');
        }

        // https://api.upsales.com/ - Comments: DELETE /comments/{id}
        await lib.request(context, { method: 'DELETE', path: '/comments/' + encodeURIComponent(commentId) });
        return context.sendJson({}, 'out');
    }
};
