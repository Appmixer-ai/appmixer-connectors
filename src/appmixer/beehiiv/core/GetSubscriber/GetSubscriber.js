'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriberId } = context.messages.in.content;
        const result = await api.GetById.execute(context, { publicationId, subscriberId });
        return context.sendJson(result, 'out');
    }
};
