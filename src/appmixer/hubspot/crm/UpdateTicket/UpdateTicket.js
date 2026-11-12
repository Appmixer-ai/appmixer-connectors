'use strict';
const Hubspot = require('../../Hubspot');
const { additionalPropertiesToObject } = require('../../commons');

module.exports = {

    async receive(context) {

        const {
            ticketId,
            subject,
            content,
            hsPipeline,
            hsPipelineStage,
            priority,
            hubSpotOwnerId,
            additionalProperties
        } = context.messages.in.content;

        if (!ticketId) {
            throw new context.CancelError('Ticket ID is required!');
        }

        const properties = {
            subject,
            content,
            hs_pipeline: hsPipeline,
            hs_pipeline_stage: hsPipelineStage,
            hs_ticket_priority: priority,
            hubspot_owner_id: hubSpotOwnerId,
            ...additionalPropertiesToObject(additionalProperties)
        };
        // Empty inputs keep the current value of the property.
        Object.keys(properties).forEach(name => {
            if (properties[name] === undefined || properties[name] === null || properties[name] === '') {
                delete properties[name];
            }
        });

        if (!Object.keys(properties).length) {
            throw new context.CancelError('Set at least one ticket property to update.');
        }

        const hs = new Hubspot(context.auth.accessToken, context.config, context.httpRequest);
        await hs.call('patch', `crm/v3/objects/tickets/${encodeURIComponent(ticketId)}`, { properties });

        return context.sendJson({}, 'out');
    }
};
