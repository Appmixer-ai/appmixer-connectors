'use strict';

const lib = require('../../lib');

// The output contract of ONE item (the out port is dynamic, so this is the only place it lives).
// Declared above module.exports: naming it there while the const sits below would throw.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'size', 'ownerId', 'createdDate'],
    properties: {
        id: {
            type: 'string',
            title: 'Data File ID',
            example: 'b2f1a0c3-4d5e-6f70-8192-a3b4c5d6e7f8'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'sales-2026.csv'
        },
        baseName: {
            type: 'string',
            title: 'Base Name',
            example: 'sales-2026.csv'
        },
        size: {
            type: 'integer',
            title: 'Size',
            example: 20480
        },
        spaceId: {
            type: 'string',
            title: 'Space ID',
            example: '62716f4b39b865ece543cd45'
        },
        ownerId: {
            type: 'string',
            title: 'Owner ID',
            example: '5f8a1c2b3d4e5f6a7b8c9d0e'
        },
        appId: {
            type: 'string',
            title: 'App ID',
            example: 'f34b2a1e-5c7d-4e8f-9a0b-1c2d3e4f5a6b'
        },
        folder: {
            type: 'boolean',
            title: 'Folder',
            example: false
        },
        folderId: {
            type: 'string',
            title: 'Folder ID',
            example: 'c3d4e5f6-a7b8-4c9d-8e0f-2a3b4c5d6e7f'
        },
        folderPath: {
            type: 'string',
            title: 'Folder Path',
            example: 'imports'
        },
        createdDate: {
            type: 'string',
            title: 'Created Date',
            example: '2026-11-16T09:00:00.000Z',
            format: 'date-time'
        },
        modifiedDate: {
            type: 'string',
            title: 'Modified Date',
            example: '2026-11-16T09:05:00.000Z',
            format: 'date-time'
        },
        contentUpdatedDate: {
            type: 'string',
            title: 'Content Updated Date',
            example: '2026-11-16T09:05:00.000Z',
            format: 'date-time'
        },
        qri: {
            type: 'string',
            title: 'QRI',
            example: 'qri:qdf:space://62716f4b39b865ece543cd45#sales-2026.csv'
        }
    }
};

// Data files list up to 1000 per page.
const DATA_FILES_PAGE_SIZE = 1000;

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { spaceId, name, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Data Files', value: 'result' });
        }

        const params = { sort: '-modifiedDate', limit: DATA_FILES_PAGE_SIZE };
        const connectionId = await lib.dataFilesConnectionId(context, spaceId);
        if (connectionId) {
            params.connectionId = connectionId;
        }
        if (name) {
            params.baseNameWildcard = name;
        }
        const { data } = await lib.apiRequest(context, { path: '/api/v1/data-files', params });
        const records = ((data && data.data) || []).map(lib.mapDataFile);
        if (!records.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records });
    }
};
