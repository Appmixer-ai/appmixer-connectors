'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        await lib.request(context, {
            method: 'DELETE',
            path: '/public/v1/documents/' + encodeURIComponent(documentId)
        });

        return context.sendJson({}, 'out');
    }
};
