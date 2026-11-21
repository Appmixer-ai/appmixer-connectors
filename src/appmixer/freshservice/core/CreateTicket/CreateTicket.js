'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const { subject, description, email, requesterId, status, priority, source, ccEmails, workspaceId } = content;

        if (!subject) {
            throw new context.CancelError('Subject is required!');
        }
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (status === undefined || status === null || status === '') {
            throw new context.CancelError('Status is required!');
        }
        if (priority === undefined || priority === null || priority === '') {
            throw new context.CancelError('Priority is required!');
        }
        if (!email && !requesterId) {
            throw new context.CancelError('Requester Email or Requester ID is required!');
        }

        const requester = requesterId
            ? { requester_id: Number(lib.requireId(context, requesterId, 'Requester ID')) }
            : { email };

        const body = lib.compact({
            ...lib.ticketFields(context, content),
            ...requester,
            source: lib.optionalNumber(context, source, 'Source'),
            cc_emails: lib.splitList(ccEmails),
            workspace_id: lib.optionalId(context, workspaceId, 'Workspace ID')
        });

        const { data } = await lib.request(context, { method: 'POST', path: '/tickets', data: body });

        return context.sendJson(lib.withoutNulls(data.ticket), 'out');
    }
};
