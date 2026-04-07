'use strict';
const axios = require('axios');
const { trimUndefined } = require('../../lib');

module.exports = {

    async receive(context) {

        const { content } = context.messages.in;
        const { auth } = context;

        const body = trimUndefined({
            body: content.body,
            user_id: content.agentId,
            cc_emails: content.ccEmails ? content.ccEmails.split(',').map(e => e.trim()) : undefined,
            bcc_emails: content.bccEmails ? content.bccEmails.split(',').map(e => e.trim()) : undefined
        });

        const url = `https://${auth.domain}.freshdesk.com/api/v2/tickets/${content.ticketId}/reply`;

        const response = await axios.post(url, body, {
            auth: {
                username: auth.apiKey,
                password: 'X'
            }
        });

        const { data } = response;
        return context.sendJson({
            id: data.id,
            ticketId: data.ticket_id,
            body: data.body,
            bodyText: data.body_text,
            agentId: data.user_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }, 'newReply');
    }
};
