'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId } = context.messages.in.content;
        const result = await api.Index6.execute(context, { publicationId });
        const customFields = result.data || [];
        for (const field of customFields) {
            await context.sendJson(field, 'out');
        }
    }
};
