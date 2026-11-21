'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'date_created', 'date_modified'],
    properties: {
        id: { type: 'string', title: 'Template ID', example: 'iMymdDd9XFD3HyxP5VD67Q' },
        name: { type: 'string', title: 'Name', example: 'Sales Quote' },
        date_created: { type: 'string', format: 'date-time', title: 'Date Created', example: '2026-06-17T15:51:13.226974Z' },
        date_modified: { type: 'string', format: 'date-time', title: 'Date Modified', example: '2026-06-17T15:51:13.326974Z' },
        version: { type: 'string', title: 'Version', example: '2' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;
        const { isSource } = context.properties;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Templates', value: 'result' });
        }

        let templates;
        try {
            templates = isSource
                ? await lib.callCached(context, { op: 'templates' }, () => lib.listTemplates(context))
                : await lib.listTemplates(context);
        } catch (err) {
            if (isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }

        return lib.sendArrayOutput({ context, outputType: isSource ? 'array' : outputType, records: templates });
    },

    toSelectArray({ result }) {

        return (result || []).map(template => ({ label: template.name, value: template.id }));
    }
};
