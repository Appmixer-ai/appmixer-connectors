'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriberId } = context.messages.in.content;
        await api.Delete4.execute(context, { publicationId, subscriberId });
        return context.sendJson({ subscriberId }, 'out');
    }
};
