'use strict';

const lib = require('../../lib');

// The output contract of one item, shared with Get Project, Create Project and New Project.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Project ID', example: 12 },
        name: { type: 'string', title: 'Name', example: 'Website relaunch' },
        number: { type: 'string', title: 'Project Number', example: '10012' },
        type: { type: 'string', title: 'Project Type', example: 'Internal' },
        status: { type: 'string', title: 'Project Status', example: 'In progress' },
        description: { type: 'string', title: 'Description', example: 'Relaunch of the public website.' },
        startDate: { type: 'string', title: 'Start Date', example: '2026-11-16T00:00:00Z' },
        endDate: { type: 'string', title: 'End Date', example: '2027-02-28T00:00:00Z' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Projects', value: 'result' });
        }

        const filters = [];
        if (name) filters.push('name contains ' + lib.quote(name));
        if (filter) filters.push(filter);

        const { items } = await lib.findItems(context, 'project', {
            filters,
            orderBy: lib.ENTITIES.project.primaryKey + ' desc'
        });

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
