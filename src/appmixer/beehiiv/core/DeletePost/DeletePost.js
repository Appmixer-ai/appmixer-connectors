'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, postId } = context.messages.in.content;
        await api.Delete2.execute(context, { publicationId, postId });
        // DELETE returns 204 No Content, so we echo back the input IDs
        return context.sendJson({ postId, publicationId, deleted: true }, 'out');
    }
};
