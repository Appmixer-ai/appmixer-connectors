'use strict';

const lib = require('../../lib');

// The output contract of ONE contact of GET /public/v1/contacts.
const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id'
    ],
    properties: {
        id: {
            type: 'string',
            title: 'Contact ID',
            example: 'BCUWJhZm3k7grUNFAz6cD2'
        },
        email: {
            type: 'string',
            title: 'Email',
            example: 'john.smith@example.com'
        },
        first_name: {
            type: 'string',
            title: 'First Name',
            example: 'John'
        },
        last_name: {
            type: 'string',
            title: 'Last Name',
            example: 'Smith'
        },
        company: {
            type: 'string',
            title: 'Company',
            example: 'Acme Inc.'
        },
        job_title: {
            type: 'string',
            title: 'Job Title',
            example: 'CTO'
        },
        phone: {
            type: 'string',
            title: 'Phone',
            example: '+14842634627'
        },
        country: {
            type: 'string',
            title: 'Country',
            example: 'USA'
        },
        state: {
            type: 'string',
            title: 'State',
            example: 'Texas'
        },
        street_address: {
            type: 'string',
            title: 'Street Address',
            example: '1313 Mockingbird Lane'
        },
        city: {
            type: 'string',
            title: 'City',
            example: 'Austin'
        },
        postal_code: {
            type: 'string',
            title: 'Postal Code',
            example: '75001'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { email, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Contacts', value: 'result' });
        }

        const body = await lib.request(context, {
            path: '/public/v1/contacts',
            params: email ? { email } : undefined
        });
        const contacts = (body && body.results) || [];

        if (contacts.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: contacts });
    }
};
