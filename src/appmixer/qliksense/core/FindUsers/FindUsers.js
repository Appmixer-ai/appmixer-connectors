'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'subject', 'tenantId'],
    properties: {
        id: {
            type: 'string',
            title: 'User ID',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Jane Doe'
        },
        email: {
            type: 'string',
            title: 'Email',
            example: 'jane.doe@example.com'
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'active'
        },
        subject: {
            type: 'string',
            title: 'Subject',
            example: 'auth0|a08D000001Lm1qzIAB'
        },
        tenantId: {
            type: 'string',
            title: 'Tenant ID',
            example: 'xqGQ0k66vSR8f9G7J-vYtHZQkiYrCpct'
        },
        locale: {
            type: 'string',
            title: 'Locale',
            example: 'en'
        },
        zoneinfo: {
            type: 'string',
            title: 'Time Zone',
            example: 'Europe/Prague'
        },
        picture: {
            type: 'string',
            title: 'Picture',
            example: 'https://s.gravatar.com/avatar/abc123.png'
        },
        createdAt: {
            type: 'string',
            title: 'Created At',
            example: '2026-11-16T09:00:00.000Z',
            format: 'date-time'
        },
        lastUpdatedAt: {
            type: 'string',
            title: 'Last Updated At',
            example: '2026-11-16T09:30:00.000Z',
            format: 'date-time'
        }
    }
};

// A SCIM filter value: a JSON string, so quotes and backslashes are escaped.
const scimValue = (value) => JSON.stringify(String(value));

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, name, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Users', value: 'result' });
        }

        // Status conditions must be grouped and applied to the whole query (Users API rules).
        const filters = [];
        if (email) {
            filters.push('email co ' + scimValue(email));
        }
        if (name) {
            filters.push('name co ' + scimValue(name));
        }
        if (status) {
            filters.push('(status eq ' + scimValue(status) + ')');
        }
        const params = { limit: lib.PAGE_SIZE, sort: '-createdAt' };
        if (filters.length) {
            params.filter = filters.join(' and ');
        }
        const { data } = await lib.apiRequest(context, { path: '/api/v1/users', params });
        const records = ((data && data.data) || []).map(lib.mapUser);
        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
