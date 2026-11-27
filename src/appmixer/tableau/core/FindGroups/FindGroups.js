'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'string', title: 'Group ID', example: '7d6c5b4a-3f2e-4d1c-8b0a-9f8e7d6c5b4a' },
        name: { type: 'string', title: 'Name', example: 'Analysts' },
        domainName: { type: 'string', title: 'Domain Name', example: 'local' },
        minimumSiteRole: { type: 'string', title: 'Minimum Site Role', example: 'Explorer' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Groups', value: 'result' });
        }

        const params = { pageSize: 1000, sort: 'name:asc' };
        const filter = lib.buildFilter(context, [
            ['name', 'eq', name, 'Name']
        ]);
        if (filter) {
            params.filter = filter;
        }

        const { data } = await lib.apiRequest(context, { path: '/groups', params });
        const records = lib.toList(data.groups, 'group').map(lib.mapGroup);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
