'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { description, userId, companyId, contactId, orderId, isPinned } = context.messages.in.content;

        if (!description) {
            throw new context.CancelError('Text is required!');
        }
        if (!userId) {
            throw new context.CancelError('Author is required!');
        }
        const targets = [companyId, contactId, orderId].filter(Boolean);
        if (targets.length !== 1) {
            throw new context.CancelError('Set exactly one of Company ID, Contact ID or Order ID.');
        }

        const body = lib.compact({
            description,
            user: lib.ref(userId),
            client: lib.ref(companyId),
            contact: lib.ref(contactId),
            opportunity: lib.ref(orderId),
            isPinned: isPinned === true
        });

        // https://api.upsales.com/ - Comments: POST /comments
        const { data } = await lib.request(context, { method: 'POST', path: '/comments', data: body });
        return context.sendJson(data.data, 'out');
    }
};
