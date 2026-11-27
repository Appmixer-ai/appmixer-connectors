'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        // The continuation that waits for the document to become a draft.
        if (context.messages.timeout) {
            return lib.continueWaitForDraft(context);
        }

        const input = context.messages.in.content;

        if (!input.templateId) {
            throw new context.CancelError('Template is required!');
        }

        const body = {
            template_uuid: input.templateId,
            ...lib.commonDocumentFields(context, input)
        };
        if (!body.recipients) {
            throw new context.CancelError('At least one recipient is required: fill in Recipient Email or Additional Recipients.');
        }

        return lib.createDocument(context, body, input.waitForDraft !== false);
    }
};
