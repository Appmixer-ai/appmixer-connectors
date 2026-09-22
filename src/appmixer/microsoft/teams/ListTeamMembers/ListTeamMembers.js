'use strict';

const lib = require('../lib');

// Graph returns up to 999 members per page for teams.
const PAGE_SIZE = 999;

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: {
            type: 'string',
            title: 'Membership ID',
            example: 'MCMjMjMjMGUyMzNjNTgtMmQ3Ni00MmQ1LWFmMDUtZTY1YTM3YjY0NmQyIyM4ZWEwZTM4Yi1lZmIzLTQ3NTctOTI0YS01Zjk0MDYxY2Y4YzI='
        },
        userId: { type: 'string', title: 'User ID', example: '8ea0e38b-efb3-4757-924a-5f94061cf8c2' },
        displayName: { type: 'string', title: 'Display Name', example: 'Robin Kline' },
        email: { type: 'string', title: 'Email', example: 'robin.kline@contoso.com' },
        roles: {
            type: 'array',
            title: 'Roles',
            example: ['owner'],
            items: { type: 'string' }
        },
        tenantId: { type: 'string', title: 'Tenant ID', example: 'dcd219dd-bc68-4b9b-bf0b-4a33a796be35' },
        visibleHistoryStartDateTime: {
            type: 'string',
            format: 'date-time',
            title: 'Visible History Start Date Time',
            example: '0001-01-01T00:00:00Z'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { teamId, outputType = 'array' } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Members' });
        }

        if (!teamId) {
            throw new context.CancelError('Team is required!');
        }

        const records = await lib.listAll(context, `/teams/${encodeURIComponent(teamId)}/members`, { $top: PAGE_SIZE });

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
