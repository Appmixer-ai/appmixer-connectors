'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'appId', 'status', 'type', 'userId', 'tenantId', 'creationTime', 'succeeded'],
    properties: {
        id: {
            type: 'string',
            title: 'Reload ID',
            example: '6577e2d1c3a5f40001a1b2c3'
        },
        appId: {
            type: 'string',
            title: 'App ID',
            example: 'f34b2a1e-5c7d-4e8f-9a0b-1c2d3e4f5a6b'
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'SUCCEEDED'
        },
        succeeded: {
            type: 'boolean',
            title: 'Succeeded',
            example: true
        },
        type: {
            type: 'string',
            title: 'Type',
            example: 'external'
        },
        partial: {
            type: 'boolean',
            title: 'Partial',
            example: false
        },
        userId: {
            type: 'string',
            title: 'User ID',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        tenantId: {
            type: 'string',
            title: 'Tenant ID',
            example: 'xqGQ0k66vSR8f9G7J-vYtHZQkiYrCpct'
        },
        weight: {
            type: 'integer',
            title: 'Weight',
            example: 0
        },
        creationTime: {
            type: 'string',
            title: 'Creation Time',
            example: '2026-11-16T10:01:40.120Z',
            format: 'date-time'
        },
        startTime: {
            type: 'string',
            title: 'Start Time',
            example: '2026-11-16T10:01:41.002Z',
            format: 'date-time'
        },
        endTime: {
            type: 'string',
            title: 'End Time',
            example: '2026-11-16T10:01:58.940Z',
            format: 'date-time'
        },
        engineTime: {
            type: 'string',
            title: 'Engine Time',
            example: '2026-11-16T10:01:58.901Z',
            format: 'date-time'
        },
        errorCode: {
            type: 'string',
            title: 'Error Code',
            example: 'EngineReloadFailed'
        },
        errorMessage: {
            type: 'string',
            title: 'Error Message',
            example: 'The data load script failed: Field not found.'
        },
        log: {
            type: 'string',
            title: 'Log',
            example: 'Started loading data\nData has been loaded.'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { appId, status, includeLog, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Reloads', value: 'result' });
        }
        if (!appId) {
            throw new context.CancelError('App is required!');
        }

        const params = { appId, sort: '-creationTime', limit: lib.PAGE_SIZE };
        if (status) {
            params.filter = 'status eq ' + JSON.stringify(status);
        }
        if (includeLog) {
            params.log = true;
        }
        const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads', params });
        const records = ((data && data.data) || []).map(lib.mapReload);
        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
