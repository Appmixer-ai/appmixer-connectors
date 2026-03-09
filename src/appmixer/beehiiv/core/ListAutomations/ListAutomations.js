'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId } = context.messages.in.content;
        const result = await api.Index3.execute(context, { publicationId });
        const automations = result.data || [];
        for (const automation of automations) {
            await context.sendJson(automation, 'out');
        }
    }
};
