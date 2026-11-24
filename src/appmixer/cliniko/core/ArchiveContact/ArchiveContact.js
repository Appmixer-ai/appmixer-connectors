'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { contactId } = context.messages.in.content;

        if (!contactId) {
            throw new context.CancelError('Contact is required!');
        }

        await lib.apiRequest(context, {
            method: 'POST',
            path: `/contacts/${encodeURIComponent(contactId)}/archive`
        });

        return context.sendJson({}, 'out');
    }
};
