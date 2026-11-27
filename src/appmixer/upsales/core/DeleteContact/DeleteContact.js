'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // https://api.upsales.com/ - Contacts: DELETE /contacts/{id}
        await lib.request(context, { method: 'DELETE', path: '/contacts/' + encodeURIComponent(contactId) });
        return context.sendJson({}, 'out');
    }
};
