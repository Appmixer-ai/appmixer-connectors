'use strict';

const lib = require('../../lib');

// The output contract of ONE ticket. The out port is dynamic, so this is where the contract lives.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'subject', 'status', 'priority', 'created_at', 'updated_at'],
    properties: {
        id: { type: 'integer', title: 'Ticket ID', example: 265 },
        subject: { type: 'string', title: 'Subject', example: 'Laptop does not start' },
        description: {
            type: 'string',
            title: 'Description (HTML)',
            example: '<div>My laptop does not start since this morning.</div>'
        },
        description_text: { type: 'string', title: 'Description', example: 'My laptop does not start since this morning.' },
        type: { type: 'string', title: 'Type', example: 'Incident' },
        status: { type: 'integer', title: 'Status', example: 2 },
        priority: { type: 'integer', title: 'Priority', example: 1 },
        source: { type: 'integer', title: 'Source', example: 2 },
        urgency: { type: 'integer', title: 'Urgency', example: 1 },
        impact: { type: 'integer', title: 'Impact', example: 1 },
        requester_id: { type: 'integer', title: 'Requester ID', example: 1000000675 },
        requested_for_id: { type: 'integer', title: 'Requested For ID', example: 1000000670 },
        responder_id: { type: 'integer', title: 'Agent ID', example: 1000000493 },
        group_id: { type: 'integer', title: 'Group ID', example: 1000000712 },
        department_id: { type: 'integer', title: 'Department ID', example: 1000000554 },
        workspace_id: { type: 'integer', title: 'Workspace ID', example: 2 },
        category: { type: 'string', title: 'Category', example: 'Hardware' },
        sub_category: { type: 'string', title: 'Sub Category', example: 'Computer' },
        item_category: { type: 'string', title: 'Item Category', example: 'Laptop' },
        due_by: { type: 'string', format: 'date-time', title: 'Due By', example: '2026-11-24T10:34:28Z' },
        fr_due_by: {
            type: 'string',
            format: 'date-time',
            title: 'First Response Due By',
            example: '2026-11-22T10:34:28Z'
        },
        is_escalated: { type: 'boolean', title: 'Is Escalated', example: false },
        fr_escalated: { type: 'boolean', title: 'First Response Escalated', example: false },
        spam: { type: 'boolean', title: 'Spam', example: false },
        deleted: { type: 'boolean', title: 'Deleted', example: false },
        tags: {
            type: 'array',
            title: 'Tags',
            items: { type: 'string' },
            example: ['laptop', 'hardware']
        },
        cc_emails: {
            type: 'array',
            title: 'CC Emails',
            items: { type: 'string' },
            example: ['ram@example.com']
        },
        custom_fields: {
            type: 'object',
            title: 'Custom Fields',
            properties: {},
            example: { asset_tag: 'LAP-042' }
        },
        created_at: { type: 'string', format: 'date-time', title: 'Created At', example: '2026-11-21T10:34:28Z' },
        updated_at: { type: 'string', format: 'date-time', title: 'Updated At', example: '2026-11-21T10:34:28Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tickets' });
        }

        const filter = lib.filterQuery(context, query);
        // A query goes to the filter endpoint (30 a page, Freshservice serves 10 pages at most);
        // without one, the list of the last 30 days, newest first.
        const tickets = filter
            ? await lib.filterPages(context, '/tickets/filter', 'tickets', { query: filter })
            : await lib.listPages(context, '/tickets', 'tickets', { order_type: 'desc' });

        const records = tickets.map(lib.withoutNulls);
        if (!records.length) {
            return context.sendJson({ query: filter || null }, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
