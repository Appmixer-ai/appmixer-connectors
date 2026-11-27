'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { documentId } = context.messages.in.content;

        if (!documentId) {
            throw new context.CancelError('Document ID is required!');
        }

        const document = await lib.getDocumentDetails(context, documentId);
        return context.sendJson(document, 'out');
    }
};
