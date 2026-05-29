'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriberId, tier } = context.messages.in.content;
        const result = await api.Patch3.execute(context, { publicationId, subscriberId, tier });
        return context.sendJson(result, 'out');
    }
};
