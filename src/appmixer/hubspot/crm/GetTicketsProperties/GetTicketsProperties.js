'use strict';

const Hubspot = require('../../Hubspot');
const { getObjectProperties, INSPECTOR_FIELDS_TICKET } = require('../../commons');

module.exports = {

    async receive(context) {

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config, context.httpRequest);
        const properties = await getObjectProperties(context, hs, 'tickets', 'all');

        return context.sendJson(properties, 'out');
    },

    /** Returns properties that are not hardcoded into the component. Both custom and HubSpot properties. */
    additionalFieldsToSelectArray(ticketsProperties) {

        return (ticketsProperties || [])
            .filter((property) => !INSPECTOR_FIELDS_TICKET.includes(property.name))
            .map((property) => {
                return { label: property.label, value: property.name };
            });
    },

    ticketToLabelNameArray(ticketsProperties) {

        const transformed = [];
        if (Array.isArray(ticketsProperties)) {
            ticketsProperties.forEach((property) => {
                if (!property.hidden) {
                    transformed.push({
                        label: property.label || property.name,
                        value: property.name
                    });
                }
            });
        }
        return transformed;
    },

    ticketToSelectArray(ticketsProperties) {

        const transformed = [];
        if (Array.isArray(ticketsProperties)) {
            ticketsProperties.forEach((property) => {
                if (!property.hidden) {
                    transformed.push({
                        label: property.label || property.name,
                        value: 'properties.' + property.name
                    });
                }
            });
        }
        return transformed;
    }
};
