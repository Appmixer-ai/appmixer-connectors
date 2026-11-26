'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        await lib.request(context, { method: 'DELETE', path: '/contacts/' + lib.encodeId(contactId) });
        return context.sendJson({}, 'out');
    }
};
