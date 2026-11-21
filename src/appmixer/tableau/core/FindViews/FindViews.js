'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'View ID', example: '8b9c0d1e-2f3a-4b5c-9d6e-7f8a9b0c1d2e' },
        name: { type: 'string', title: 'Name', example: 'Sales by Region' },
        contentUrl: { type: 'string', title: 'Content URL', example: 'SalesOverview/sheets/SalesbyRegion' },
        viewUrlName: { type: 'string', title: 'View URL Name', example: 'SalesbyRegion' },
        sheetType: { type: 'string', title: 'Sheet Type', example: 'dashboard' },
        createdAt: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-10-01T09:30:00Z' },
        updatedAt: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-02T14:05:00Z' },
        workbookId: { type: 'string', title: 'Workbook ID', example: '5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d' },
        ownerId: { type: 'string', title: 'Owner ID', example: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b' },
        projectId: { type: 'string', title: 'Project ID', example: '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b' },
        tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            example: ['sales']
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, workbookName, projectName, tag, updatedAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Views', value: 'result' });
        }

        const params = { pageSize: 1000, sort: 'name:asc' };
        const filter = lib.buildFilter(context, [
            ['name', 'eq', name, 'Name'],
            ['workbookName', 'eq', workbookName, 'Workbook Name'],
            ['projectName', 'eq', projectName, 'Project Name'],
            ['tags', 'eq', tag, 'Tag'],
            ['updatedAt', 'gte', updatedAfter, 'Updated After']
        ]);
        if (filter) {
            params.filter = filter;
        }

        const { data } = await lib.apiRequest(context, { path: '/views', params });
        const records = lib.toList(data.views, 'view').map(lib.mapView);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
