'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { boardId: rawBoardId, emails: rawEmails, role, message } = context.messages.in.content;
        if (!rawBoardId) {
            throw new context.CancelError('Board is required!');
        }
        const boardId = lib.requireId(context, rawBoardId, 'Board');
        const emails = lib.splitList(rawEmails);

        if (!emails.length) {
            throw new context.CancelError('Emails is required!');
        }

        const result = await lib.request(context, {
            method: 'POST',
            path: '/boards/' + boardId + '/members',
            data: lib.compact({ emails, role, message })
        }) || {};

        const successful = Array.isArray(result.successful) ? result.successful : [];
        const failed = Array.isArray(result.failed) ? result.failed : [];
        return context.sendJson({
            successful,
            failed,
            successfulCount: successful.length,
            failedCount: failed.length
        }, 'out');
    }
};
