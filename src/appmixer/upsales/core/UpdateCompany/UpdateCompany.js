'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            companyId,
            name,
            phone,
            webpage,
            notes,
            userId,
            parentId,
            customFields
        } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
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

        // https://api.upsales.com/ - Company: PUT /accounts/{id}
        await lib.request(context, { method: 'PUT', path: '/accounts/' + encodeURIComponent(companyId), data: body });
        return context.sendJson({}, 'out');
    }
};
