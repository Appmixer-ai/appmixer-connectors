'use strict';
const lib = require('../../lib');

module.exports = {
    async receive(context) {
        const { pageId } = context.messages.in.content;
        if (!pageId) {
            throw new context.CancelError('Page ID is required!');
        }

        // Notion-Version 2022-06-28 (lib.API_VERSION) moves a page to the trash
        // with `archived: true`; newer API versions name the same flag `in_trash`.
        await lib.callEndpoint(context, `/pages/${encodeURIComponent(pageId)}`, {
            method: 'PATCH',
            data: { archived: true }
        });

        await context.sendJson({}, 'out');
    }
};
