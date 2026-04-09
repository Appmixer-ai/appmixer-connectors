'use strict';
const axios = require('axios');
const { normalizeMultiselectInput } = require('../../lib');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const { ticketId, embed } = context.messages.in.content;

        // Normalize the multiselect field
        const normalizedEmbed = embed ?
            normalizeMultiselectInput(embed, context, 'Embed fields') : [];

        const requestObject = {
            auth: {
                username: auth.apiKey,
                password: 'X'
            }
        };

        if (normalizedEmbed.length > 0) {
            requestObject.params = { include: normalizedEmbed.join(',') };
        }

        const url = `https://${auth.domain}.freshdesk.com/api/v2/tickets/${ticketId}`;
        const { data } = await axios.get(url, requestObject);

        const fields = {
            id: data.id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            due_by: data.due_by,
            fr_due_by: data.fr_due_by,
            subject: data.subject,
            description: data.description_text,
            requester_id: data.requester_id,
            type: data.type,
            source: data.source,
            source_info: data.source_info || null,
            status: data.status,
            priority: data.priority,
            agentId: data.responder_id,
            group_id: data.group_id,
            email_config_id: data.email_config_id,
            product_id: data.product_id,
            tags: data.tags,
            custom_fields: data.custom_fields,
            ticketJson: data
        };

        if (normalizedEmbed.includes('conversations')) {
            fields.conversations = data.conversations;
        }

        if (normalizedEmbed.includes('requester')) {
            fields.requester_name = data.requester.name;
            fields.requester_email = data.requester.email;
        }

        if (normalizedEmbed.includes('company')) {
            fields.company = data.company;
        }

        if (normalizedEmbed.includes('stats')) {
            fields.stats = data.stats;
        }

        return context.sendJson(fields, 'ticket');
    }
};
