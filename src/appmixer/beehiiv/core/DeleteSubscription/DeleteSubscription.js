'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, subscriptionId } = context.messages.in.content;
        await api.Delete4.execute(context, { publicationId, subscriptionId });
        return context.sendJson({ subscriptionId }, 'out');
    }
};
