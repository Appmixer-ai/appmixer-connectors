'use strict';

const lib = require('../../lib');

// The output contract of ONE document of GET /public/v1/documents.
const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id',
        'name',
        'status',
        'date_created',
        'date_modified'
    ],
    properties: {
        id: {
            type: 'string',
            title: 'Document ID',
            example: 'msFYActMfJHqNTKH8YSvF1'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Quote for Acme Inc.'
        },
        status: {
            type: 'string',
            title: 'Status',
            example: 'document.draft'
        },
        date_created: {
            type: 'string',
            title: 'Date Created',
            example: '2026-11-20T09:15:00.000000Z',
            format: 'date-time'
        },
        date_modified: {
            type: 'string',
            title: 'Date Modified',
            example: '2026-11-20T09:15:04.000000Z',
            format: 'date-time'
        },
        date_sent: {
            type: 'string',
            title: 'Date Sent',
            example: '2026-11-20T09:20:31.000000Z',
            format: 'date-time'
        },
        date_completed: {
            type: 'string',
            title: 'Date Completed',
            example: '2026-11-21T14:02:11.000000Z',
            format: 'date-time'
        },
        expiration_date: {
            type: 'string',
            title: 'Expiration Date',
            example: '2027-01-19T09:15:00.000000Z',
            format: 'date-time'
        },
        version: {
            type: 'string',
            title: 'Version',
            example: '2'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const input = context.messages.in.content;
        const { outputType } = input;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Documents', value: 'result' });
        }

        const params = { order_by: input.orderBy || '-date_created' };
        if (input.query) {
            params.q = input.query;
        }
        if (input.status) {
            if (lib.DOCUMENT_STATUS_CODES[input.status] === undefined) {
                throw new context.CancelError('Unknown document status ' + input.status + '.');
            }
            params.status = lib.DOCUMENT_STATUS_CODES[input.status];
        }
        if (input.templateId) {
            params.template_id = input.templateId;
        }
        if (input.contactId) {
            params.contact_id = input.contactId;
        }
        if (input.tag) {
            params.tag = input.tag;
        }
        if (input.folderId) {
            params.folder_uuid = input.folderId;
        }
        const createdFrom = lib.toIsoDate(context, input.createdFrom, 'Created From');
        if (createdFrom) {
            params.created_from = createdFrom;
        }
        const createdTo = lib.toIsoDate(context, input.createdTo, 'Created To');
        if (createdTo) {
            params.created_to = createdTo;
        }

        const documents = await lib.listDocuments(context, params);

        if (documents.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: documents });
    }
};
