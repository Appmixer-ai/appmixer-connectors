'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            title,
            statusId,
            typeId,
            companyId,
            contactId,
            userId,
            priority,
            customFields
        } = context.messages.in.content;

        if (!title) {
            throw new context.CancelError('Title is required!');
        }
        if (!statusId) {
            throw new context.CancelError('Status ID is required!');
        }
        if (!typeId) {
            throw new context.CancelError('Type ID is required!');
        }

        const body = lib.compact({
            title,
            status: lib.ref(statusId),
            type: lib.ref(typeId),
            client: lib.ref(companyId),
            contact: lib.ref(contactId),
            user: lib.ref(userId),
            priority: priority === undefined || priority === null || priority === '' ? undefined : Number(priority),
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Support tickets: POST /tickets
        const { data } = await lib.request(context, { method: 'POST', path: '/tickets', data: body });
        return context.sendJson(data.data, 'out');
    }
};
