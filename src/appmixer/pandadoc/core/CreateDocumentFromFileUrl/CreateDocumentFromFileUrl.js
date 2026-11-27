'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The continuation that waits for the document to become a draft.
        if (context.messages.timeout) {
            return lib.continueWaitForDraft(context);
        }

        const input = context.messages.in.content;

        if (!input.url) {
            throw new context.CancelError('File URL is required!');
        }
        if (!input.name) {
            throw new context.CancelError('Document Name is required!');
        }

        const body = {
            url: input.url,
            parse_form_fields: input.parseFormFields === true,
            ...lib.commonDocumentFields(context, input)
        };

        return lib.createDocument(context, body, input.waitForDraft !== false);
    }
};
