'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, postId } = context.messages.in.content;
        const result = await api.Show6.execute(context, { publicationId, postId });
        return context.sendJson(result, 'out');
    }
};
