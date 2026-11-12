'use strict';
const Hubspot = require('../../Hubspot');
const ITEM_SCHEMA = require('../../item-schemas.json').company;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { companyId, idProperty, properties, associations } = context.messages.in.content;

        if (!companyId) {
            throw new context.CancelError('Company ID is required!');
        }

        const params = { archived: false };
        if (idProperty) {
            params.idProperty = idProperty;
        }
        if (properties) {
            params.properties = properties;
        }
        if (associations) {
            params.associations = associations;
        }

        const hs = new Hubspot(context.auth.accessToken, context.config, context.httpRequest);
        try {
            const { data } = await hs.call('get', `crm/v3/objects/companies/${encodeURIComponent(companyId)}`, params);
            return context.sendJson(data, 'company');
        } catch (err) {
            if ((err.status || err.response?.status) === 404) {
                return context.sendJson({ companyId }, 'notFound');
            }
            throw err;
        }
    }
};
