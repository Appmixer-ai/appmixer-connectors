'use strict';

const lib = require('../../lib');

// The output contract of one item, shared with Get Person, Create Person and New Person.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'integer', title: 'Person ID', example: 342 },
        firstName: { type: 'string', title: 'First Name', example: 'Jane' },
        lastName: { type: 'string', title: 'Last Name', example: 'Doe' },
        fullName: { type: 'string', title: 'Full Name', example: 'Jane Doe' },
        title: { type: 'string', title: 'Title', example: 'Head of Purchasing' },
        position: { type: 'string', title: 'Position', example: 'Purchaser' },
        companyId: { type: 'integer', title: 'Company ID', example: 125 },
        companyName: { type: 'string', title: 'Company Name', example: 'Acme Inc.' },
        email: { type: 'string', title: 'Email', example: 'jane.doe@acme.example' },
        mobilePhone: { type: 'string', title: 'Mobile Phone', example: '+47 900 00 000' },
        officePhone: { type: 'string', title: 'Office Phone', example: '+47 22 00 00 01' },
        createdDate: { type: 'string', title: 'Created Date', example: '2026-11-16T10:30:00' },
        updatedDate: { type: 'string', title: 'Updated Date', example: '2026-11-17T08:15:00' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, email, companyId, filter, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Persons', value: 'result' });
        }

        const filters = [];
        if (name) filters.push('fullName contains ' + lib.quote(name));
        if (email) filters.push('email/emailAddress is ' + lib.quote(email));
        const contactId = lib.toInteger(context, companyId, 'Company ID');
        if (contactId !== undefined) filters.push('contactId eq ' + contactId);
        if (filter) filters.push(filter);

        const { items } = await lib.findItems(context, 'person', {
            filters,
            orderBy: lib.ENTITIES.person.primaryKey + ' desc'
        });

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
