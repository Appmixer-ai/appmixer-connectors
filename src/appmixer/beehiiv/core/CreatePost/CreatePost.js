'use strict';

const api = require('../../api');

module.exports = {
    async receive(context) {
        const { publicationId, title, subtitle, content_html, audience, status } = context.messages.in.content;
        const result = await api.Create5.execute(context, { publicationId, title, subtitle, content_html, audience, status });
        return context.sendJson(result, 'out');
    }
};
