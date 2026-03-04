'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, email } = context.messages.in.content;
        const result = await api.GetByEmail.execute(context, { publicationId, email });
        return context.sendJson(result, 'out');
    }
};
