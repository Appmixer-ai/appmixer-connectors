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
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            dueBy: data.due_by,
            frDueBy: data.fr_due_by,
            subject: data.subject,
            description: data.description_text,
            requesterId: data.requester_id,
            type: data.type,
            source: data.source,
            sourceInfo: data.source_info || null,
            status: data.status,
            priority: data.priority,
            agentId: data.responder_id,
            groupId: data.group_id,
            emailConfigId: data.email_config_id,
            productId: data.product_id,
            tags: data.tags,
            customFields: data.custom_fields,
            ticketJson: data
        };

        if (normalizedEmbed.includes('conversations')) {
            fields.conversations = data.conversations;
        }

        if (normalizedEmbed.includes('requester')) {
            fields.requesterName = data.requester.name;
            fields.requesterEmail = data.requester.email;
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
