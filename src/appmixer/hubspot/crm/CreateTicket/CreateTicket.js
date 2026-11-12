'use strict';
const Hubspot = require('../../Hubspot');
const { parseIdList, buildAssociations, additionalPropertiesToObject } = require('../../commons');
const ITEM_SCHEMA = require('../../item-schemas.json').ticket;

// Default (HUBSPOT_DEFINED) association type IDs from a ticket to other objects.
// https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide#ticket-to-object
const TICKET_TO_CONTACT = 16;
const TICKET_TO_COMPANY = 339;
const TICKET_TO_DEAL = 28;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            subject,
            content,
            hsPipeline,
            hsPipelineStage,
            priority,
            hubSpotOwnerId,
            additionalProperties,
            contactIds,
            companyIds,
            dealIds
        } = context.messages.in.content;

        if (!subject) {
            throw new context.CancelError('Ticket Name is required!');
        }
        if (!hsPipelineStage) {
            throw new context.CancelError('Ticket Status is required!');
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
        Object.keys(properties).forEach(name => {
            if (properties[name] === undefined || properties[name] === null || properties[name] === '') {
                delete properties[name];
            }
        });

        const payload = { properties };
        const associations = buildAssociations([
            { ids: parseIdList(contactIds), associationTypeId: TICKET_TO_CONTACT },
            { ids: parseIdList(companyIds), associationTypeId: TICKET_TO_COMPANY },
            { ids: parseIdList(dealIds), associationTypeId: TICKET_TO_DEAL }
        ]);
        if (associations.length) {
            payload.associations = associations;
        }

        const hs = new Hubspot(context.auth.accessToken, context.config, context.httpRequest);
        const { data } = await hs.call('post', 'crm/v3/objects/tickets', payload);

        return context.sendJson(data, 'ticket');
    }
};
