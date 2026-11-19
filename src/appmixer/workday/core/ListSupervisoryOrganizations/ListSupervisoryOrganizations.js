'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'descriptor'],
    properties: {
        id: { type: 'string', title: 'Organization ID', example: '0d2d6a1c8e5c4d6b9a6c5e8f2b1a3c4d' },
        descriptor: { type: 'string', title: 'Name', example: 'Human Resources' },
        name: { type: 'string', title: 'Organization Name', example: 'Human Resources' },
        code: { type: 'string', title: 'Code', example: 'HR' },
        Organization_Reference_ID: { type: 'string', title: 'Reference ID', example: 'SUPERVISORY_Human_Resources' },
        inactive: { type: 'boolean', title: 'Inactive', example: false },
        managers: {
            type: 'array',
            title: 'Managers',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', title: 'Worker ID', example: '3aa5550b7fe348b98d7b5741afc65534' },
                    descriptor: { type: 'string', title: 'Name', example: 'Logan McNeil' }
                }
            },
            example: [{
                id: '3aa5550b7fe348b98d7b5741afc65534',
                descriptor: 'Logan McNeil'
            }]
        },
        superior: {
            type: 'object',
            title: 'Superior Organization',
            properties: {
                id: { type: 'string', title: 'Superior Organization.ID', example: '2f1c6c1e7b6a4d0e9a1b3c5d7e9f0a1b' },
                descriptor: { type: 'string', title: 'Superior Organization.Name', example: 'Global Modern Services' },
                name: { type: 'string', title: 'Superior Organization.Organization Name', example: 'Global Modern Services' },
                code: { type: 'string', title: 'Superior Organization.Code', example: 'GMS' },
                Organization_Reference_ID: { type: 'string', title: 'Superior Organization.Reference ID', example: 'SUPERVISORY_Global_Modern_Services' }
            }
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { includeHierarchy, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Organizations', value: 'result' });
        }

        if (context.properties.isSource) {
            const result = await lib.cachedSource(context, 'supervisoryOrganizations',
                () => lib.listSupervisoryOrganizations(context));
            return context.sendJson({ result, count: result.length }, 'out');
        }

        const records = await lib.listSupervisoryOrganizations(context, { includeHierarchy });
        return lib.sendArrayOutput({ context, records, outputType });
    },

    toSelectArray(message) {

        const organizations = (message && message.result) || [];
        return organizations.map(organization => ({
            label: organization.descriptor || organization.name || organization.id,
            value: organization.id
        }));
    }
};
