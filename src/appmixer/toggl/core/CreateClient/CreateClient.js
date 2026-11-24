'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { name, contactEmail, address, internalReference } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const body = { name };
        if (contactEmail) body.contact_email = contactEmail;
        if (address) body.address = address;
        if (internalReference) body.internal_reference = internalReference;

        const { workspaceOnly } = await lib.urls(context);
        const { data } = await lib.request(context, {
            method: 'POST',
            url: `${workspaceOnly}/clients`,
            data: body
        });

        return context.sendJson(lib.withoutNulls(data), 'out');
    }
};
