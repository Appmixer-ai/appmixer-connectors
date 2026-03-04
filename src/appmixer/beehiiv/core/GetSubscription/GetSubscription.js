'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriptionId } = context.messages.in.content;
        const result = await api.GetById.execute(context, { publicationId, subscriptionId });
        return context.sendJson(result, 'out');
    }
};
