'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    'type': 'object',
    'required': [
        'id'
    ],
    'properties': {
        'id': {
            'type': 'string',
            'title': 'Contact ID',
            'example': '3456789012'
        },
        'first_name': {
            'type': 'string',
            'title': 'First Name',
            'example': 'Jane'
        },
        'last_name': {
            'type': 'string',
            'title': 'Last Name',
            'example': 'Doe'
        },
        'email': {
            'type': 'string',
            'title': 'Email',
            'example': 'jane.doe@example.com'
        },
        'phone_number': {
            'type': 'string',
            'title': 'Phone Number',
            'example': '+15555550123'
        },
        'href': {
            'type': 'string',
            'title': 'API URL',
            'example': 'https://api.surveymonkey.com/v3/contacts/3456789012'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { searchBy, search, status, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Contacts', value: 'result' });
        }

        const params = { per_page: lib.MAX_PAGE_SIZE };
        if (status) {
            params.status = status;
        }
        if (search) {
            params.search = search;
            params.search_by = searchBy || 'email';
        }

        const body = await lib.request(context, { path: '/contacts', params });
        const contacts = (body && body.data) || [];

        if (!contacts.length) {
            return context.sendJson({}, 'notFound');
        }
        return lib.sendArrayOutput({ context, outputType, records: contacts });
    }
};
