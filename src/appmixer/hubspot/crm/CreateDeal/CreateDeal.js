'use strict';
const Hubspot = require('../../Hubspot');
const { parseIdList, buildAssociations } = require('../../commons');
const ITEM_SCHEMA = require('../../item-schemas.json').deal;

// Default (HUBSPOT_DEFINED) association type IDs from a deal to other objects.
// https://developers.hubspot.com/docs/api-reference/crm-associations-v4/guide#deal-to-object
const DEAL_TO_CONTACT = 3;
const DEAL_TO_COMPANY = 341;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            dealname,
            dealstage,
            pipeline,
            hubSpotOwnerId,
            closedate,
            amount,
            contactIds,
            companyIds
        } = context.messages.in.content;

        if (!dealname) {
            throw new context.CancelError('Deal Name is required!');
        }

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config, context.httpRequest);

        const additionalPropertiesArray = context.messages.in.content.additionalProperties?.AND || [];
        const additionalProperties = additionalPropertiesArray.reduce((acc, field) => {
            acc[field.name] = field.value;
            return acc;
        }, {});

        const payload = {
            properties: {
                amount: amount || '',
                dealname: dealname,
                dealstage: dealstage || 'appointmentscheduled',
                hubspot_owner_id: hubSpotOwnerId,
                pipeline:  pipeline || 'default',
                ...additionalProperties
            }
        };


        if (closedate) {
            payload.properties.closedate = (new Date(closedate)).toISOString();
        }

        const associations = buildAssociations([
            { ids: parseIdList(contactIds), associationTypeId: DEAL_TO_CONTACT },
            { ids: parseIdList(companyIds), associationTypeId: DEAL_TO_COMPANY }
        ]);
        if (associations.length) {
            payload.associations = associations;
        }

        const { data } = await hs.call('post', 'crm/v3/objects/deals', payload);

        return context.sendJson(data, 'newDeal');
    }
};
