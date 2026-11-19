'use strict';

const lib = require('../../lib');

// The output contract of one item, shared with Get Sale, Create Sale and New Sale.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'Sale ID', example: 57 },
        heading: { type: 'string', title: 'Heading', example: '50 licences' },
        amount: { type: 'number', title: 'Amount', example: 12500 },
        saleDate: { type: 'string', title: 'Sale Date', example: '2026-12-15T00:00:00' },
        status: { type: 'string', title: 'Status', example: 'Open' },
        probability: { type: 'integer', title: 'Probability', example: 50 },
        saleType: { type: 'string', title: 'Sale Type', example: 'New business' },
        companyId: { type: 'integer', title: 'Company ID', example: 125 },
        companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
        personId: { type: 'integer', title: 'Person ID', example: 342 },
        personName: { type: 'string', title: 'Person Name', example: 'Jane Doe' },
        projectId: { type: 'integer', title: 'Project ID', example: 12 },
        description: { type: 'string', title: 'Description', example: 'Renewal of the yearly licence.' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { heading, companyId, personId, filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Sales', value: 'result' });
        }

        const filters = [];
        if (heading) filters.push('heading contains ' + lib.quote(heading));
        const contactId = lib.toInteger(context, companyId, 'Company ID');
        if (contactId !== undefined) filters.push('contact/contactId eq ' + contactId);
        const personNumber = lib.toInteger(context, personId, 'Person ID');
        if (personNumber !== undefined) filters.push('person/personId eq ' + personNumber);
        if (filter) filters.push(filter);

        const { items } = await lib.findItems(context, 'sale', {
            filters,
            orderBy: lib.ENTITIES.sale.primaryKey + ' desc'
        });

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
