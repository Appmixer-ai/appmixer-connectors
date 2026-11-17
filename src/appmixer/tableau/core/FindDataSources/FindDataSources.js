'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'Data Source ID', example: '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f' },
        name: { type: 'string', title: 'Name', example: 'Superstore Orders' },
        description: { type: 'string', title: 'Description', example: 'Orders extract refreshed nightly' },
        contentUrl: { type: 'string', title: 'Content URL', example: 'SuperstoreOrders' },
        type: { type: 'string', title: 'Type', example: 'hyper' },
        webpageUrl: {
            type: 'string',
            title: 'Webpage URL',
            example: 'https://10ay.online.tableau.com/#/site/mysite/datasources/67890'
        },
        isCertified: { type: 'boolean', title: 'Certified', example: false },
        certificationNote: { type: 'string', title: 'Certification Note', example: 'Approved by the BI team' },
        hasExtracts: { type: 'boolean', title: 'Has Extracts', example: true },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-10-01T09:30:00Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-02T14:05:00Z' },
        projectId: { type: 'string', title: 'Project ID', example: '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b' },
        projectName: { type: 'string', title: 'Project Name', example: 'Default' },
        ownerId: { type: 'string', title: 'Owner ID', example: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b' },
        tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            example: ['finance']
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, projectName, ownerName, tag, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Data Sources', value: 'result' });
        }

        const params = { pageSize: 1000, sort: 'name:asc' };
        const filter = lib.buildFilter(context, [
            ['name', 'eq', name, 'Name'],
            ['projectName', 'eq', projectName, 'Project Name'],
            ['ownerName', 'eq', ownerName, 'Owner Name'],
            ['tags', 'eq', tag, 'Tag'],
            ['updatedAt', 'gte', updatedAfter, 'Updated After']
        ]);
        if (filter) {
            params.filter = filter;
        }

        const { data } = await lib.apiRequest(context, { path: '/datasources', params });
        const records = lib.toList(data.datasources, 'datasource').map(lib.mapDataSource);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
