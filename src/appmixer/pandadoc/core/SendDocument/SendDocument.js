'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { documentId, subject, message, silent } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        const data = { silent: silent === true };
        if (subject) {
            data.subject = subject;
        }
        if (message) {
            data.message = message;
        }

        const document = await lib.request(context, {
            method: 'POST',
            path: '/public/v1/documents/' + encodeURIComponent(documentId) + '/send',
            data
        });

        return context.sendJson({
            ...lib.toDocument(document),
            recipients: document.recipients || []
        }, 'out');
    }
};
