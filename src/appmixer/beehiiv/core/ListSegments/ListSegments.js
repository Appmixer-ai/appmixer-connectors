'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId } = context.messages.in.content;
        const result = await api.Index12.execute(context, { publicationId });
        const segments = result.data || [];
        for (const segment of segments) {
            await context.sendJson(segment, 'out');
        }
    }
};
