'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, status, audience, limit, outputType } = context.messages.in.content;
        const result = await api.Index9.execute(context, { publicationId, status, audience, limit });

        if (outputType === 'item') {
            const items = result.data || [];
            for (const item of items) {
                await context.sendJson({ data: item }, 'out');
            }
        } else {
            return context.sendJson(result, 'out');
        }
    }
};
