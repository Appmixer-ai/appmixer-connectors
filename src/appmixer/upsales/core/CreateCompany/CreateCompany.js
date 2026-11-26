'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, phone, webpage, notes, userId, parentId, customFields } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = lib.compact({
            name,
            phone,
            webpage,
            notes,
            users: userId ? [lib.ref(userId)] : undefined,
            parent: lib.ref(parentId),
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Company: POST /accounts
        const { data } = await lib.request(context, { method: 'POST', path: '/accounts', data: body });
        return context.sendJson(data.data, 'out');
    }
};
