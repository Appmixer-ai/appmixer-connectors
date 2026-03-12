'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, status, tier, limit, outputType } = context.messages.in.content;
        const result = await api.Index5.execute(context, { publicationId, status, tier, limit });

        const items = result.data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        if (outputType === 'item') {
            for (const item of items) {
                await context.sendJson({ data: item }, 'out');
            }
        } else {
            return context.sendJson({ subscribers: items }, 'out');
        }
    }
};
