'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, status, audience, limit, outputType } = context.messages.in.content;

        const params = { publicationId, limit };
        if (status && status !== 'all') params.status = status;
        if (audience && audience !== 'all') params.audience = audience;

        const result = await api.Index9.execute(context, params);
        const items = result.data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        if (outputType === 'item') {
            for (const item of items) {
                await context.sendJson({ data: item }, 'out');
            }
        } else {
            return context.sendJson({ posts: items }, 'out');
        }
    }
};
