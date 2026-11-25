'use strict';

const lib = require('../../lib');

// The output contract of one item, shared with Get Follow-up, Create Follow-up and New Follow-up.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'Follow-up ID', example: 981 },
        title: { type: 'string', title: 'Title', example: 'Kick-off meeting' },
        description: { type: 'string', title: 'Description', example: 'Agree on the project plan.' },
        startDate: { type: 'string', title: 'Start Date', example: '2026-11-20T09:00:00Z' },
        endDate: { type: 'string', title: 'End Date', example: '2026-11-20T10:00:00Z' },
        task: { type: 'string', title: 'Task', example: 'Meeting' },
        type: { type: 'string', title: 'Type', example: 'inDiary' },
        completed: { type: 'string', title: 'Completed', example: 'NotStarted' },
        location: { type: 'string', title: 'Location', example: 'Meeting room 1' },
        companyId: { type: 'integer', title: 'Company ID', example: 125 },
        companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
        personId: { type: 'integer', title: 'Person ID', example: 342 },
        personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
        projectId: { type: 'integer', title: 'Project ID', example: 12 },
        saleId: { type: 'integer', title: 'Sale ID', example: 57 },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { companyId, personId, projectId, filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Follow-ups', value: 'result' });
        }

        const filters = [];
        const contactId = lib.toInteger(context, companyId, 'Company ID');
        if (contactId !== undefined) filters.push('contact/contactId eq ' + contactId);
        const personNumber = lib.toInteger(context, personId, 'Person ID');
        if (personNumber !== undefined) filters.push('person/personId eq ' + personNumber);
        const projectNumber = lib.toInteger(context, projectId, 'Project ID');
        if (projectNumber !== undefined) filters.push('project/projectId eq ' + projectNumber);
        if (filter) filters.push(filter);

        const { items } = await lib.findItems(context, 'appointment', {
            filters,
            orderBy: lib.ENTITIES.appointment.primaryKey + ' desc'
        });

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
