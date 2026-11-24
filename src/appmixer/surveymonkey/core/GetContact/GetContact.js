'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        const contact = await lib.request(context, { path: '/contacts/' + lib.encodeId(contactId) });
        return context.sendJson(contact, 'out');
    }
};
