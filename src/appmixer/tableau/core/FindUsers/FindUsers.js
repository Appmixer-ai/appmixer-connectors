'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'siteRole'],
    properties: {
        id: { type: 'string', title: 'User ID', example: '9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b' },
        name: { type: 'string', title: 'Name', example: 'jane.doe@example.com' },
        fullName: { type: 'string', title: 'Full Name', example: 'Jane Doe' },
        email: { type: 'string', title: 'Email', example: 'jane.doe@example.com' },
        siteRole: { type: 'string', title: 'Site Role', example: 'Explorer' },
        authSetting: { type: 'string', title: 'Authentication', example: 'ServerDefault' },
        lastLogin: { type: 'string', format: 'date-time', title: 'Last Login', example: '2026-11-15T08:12:00Z' },
        externalAuthUserId: { type: 'string', title: 'External Auth User ID', example: '00u1abcd2EFGH3ijk4l5' },
        locale: { type: 'string', title: 'Locale', example: 'en_US' },
        language: { type: 'string', title: 'Language', example: 'en' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, siteRole, lastLoginAfter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Users', value: 'result' });
        }

        const params = { pageSize: 1000, sort: 'name:asc' };
        const filter = lib.buildFilter(context, [
            ['name', 'eq', name, 'Name'],
            ['siteRole', 'eq', siteRole, 'Site Role'],
            ['lastLogin', 'gte', lastLoginAfter, 'Last Sign-In After']
        ]);
        if (filter) {
            params.filter = filter;
        }

        const { data } = await lib.apiRequest(context, { path: '/users', params });
        const records = lib.toList(data.users, 'user').map(lib.mapUser);

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
