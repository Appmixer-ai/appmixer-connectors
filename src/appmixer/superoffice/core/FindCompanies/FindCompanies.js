'use strict';

const lib = require('../../lib');

// The output contract of one item, shared with Get Company, Create Company and New Company.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'name'],
    properties: {
        id: { type: 'integer', title: 'Company ID', example: 125 },
        name: { type: 'string', title: 'Name', example: 'Acme Inc.' },
        department: { type: 'string', title: 'Department', example: 'Sales' },
        orgNr: { type: 'string', title: 'Organization Number', example: '987654321' },
        category: { type: 'string', title: 'Category', example: 'Customer' },
        business: { type: 'string', title: 'Business', example: 'IT' },
        country: { type: 'string', title: 'Country', example: 'Norway' },
        email: { type: 'string', title: 'Email', example: 'info@acme.example' },
        phone: { type: 'string', title: 'Phone', example: '+47 22 00 00 00' },
        website: { type: 'string', title: 'Website', example: 'https://acme.example' },
        description: { type: 'string', title: 'Description', example: 'Reseller for the Nordic market.' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00Z' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, orgNr, email, filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Companies', value: 'result' });
        }

        const filters = [];
        if (name) filters.push('name contains ' + lib.quote(name));
        if (orgNr) filters.push('orgnr is ' + lib.quote(orgNr));
        if (email) filters.push('email/emailAddress is ' + lib.quote(email));
        if (filter) filters.push(filter);

        const { items } = await lib.findItems(context, 'company', {
            filters,
            orderBy: lib.ENTITIES.company.primaryKey + ' desc'
        });

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
