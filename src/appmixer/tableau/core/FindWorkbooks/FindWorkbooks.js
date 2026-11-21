'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'Workbook ID', example: '5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d' },
        name: { type: 'string', title: 'Name', example: 'Sales Overview' },
        description: { type: 'string', title: 'Description', example: 'Monthly sales by region' },
        contentUrl: { type: 'string', title: 'Content URL', example: 'SalesOverview' },
        webpageUrl: {
            type: 'string',
            title: 'Webpage URL',
            example: 'https://10ay.online.tableau.com/#/site/mysite/workbooks/12345'
        },
        showTabs: { type: 'boolean', title: 'Show Tabs', example: true },
        size: { type: 'integer', title: 'Size (MB)', example: 2 },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-10-01T09:30:00Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-02T14:05:00Z' },
        defaultViewId: { type: 'string', title: 'Default View ID', example: '8b9c0d1e-2f3a-4b5c-9d6e-7f8a9b0c1d2e' },
        projectId: { type: 'string', title: 'Project ID', example: '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b' },
        projectName: { type: 'string', title: 'Project Name', example: 'Default' },
        ownerId: { type: 'string', title: 'Owner ID', example: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b' },
        ownerName: { type: 'string', title: 'Owner Name', example: 'jane.doe@example.com' },
        tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            example: ['sales', 'monthly']
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, projectName, ownerName, tag, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Workbooks', value: 'result' });
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

        const { data } = await lib.apiRequest(context, { path: '/workbooks', params });
        const records = lib.toList(data.workbooks, 'workbook').map(lib.mapWorkbook);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
