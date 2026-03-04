'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriptionId, tier } = context.messages.in.content;
        const result = await api.Patch3.execute(context, { publicationId, subscriptionId, tier });
        return context.sendJson(result, 'out');
    }
};
