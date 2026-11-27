'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        // https://api.upsales.com/ - Contacts: GET /contacts/{id}
        const { data } = await lib.request(context, { path: '/contacts/' + encodeURIComponent(contactId) });
        return context.sendJson(data.data, 'out');
    }
};
