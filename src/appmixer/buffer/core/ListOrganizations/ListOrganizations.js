'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = require('../../schemas/organization.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Organizations', value: 'result' });
        }

        let organizations;
        try {
            organizations = isSource
                ? await lib.callCached(context, { op: 'organizations' }, () => lib.listOrganizations(context))
                : await lib.listOrganizations(context);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: organizations });
    },

    toSelectArray({ result }) {

        return (result || []).map(org => ({ label: org.name || org.id, value: org.id }));
    }
};
