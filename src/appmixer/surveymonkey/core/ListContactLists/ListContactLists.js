'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    'type': 'object',
    'required': [
        'id',
        'name'
    ],
    'properties': {
        'id': {
            'type': 'string',
            'title': 'Contact List ID',
            'example': '2345678901'
        },
        'name': {
            'type': 'string',
            'title': 'Name',
            'example': 'Newsletter subscribers'
        },
        'href': {
            'type': 'string',
            'title': 'API URL',
            'example': 'https://api.surveymonkey.com/v3/contact_lists/2345678901'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Contact Lists', value: 'result' });
        }

        const body = await lib.request(context, { path: '/contact_lists', params: { per_page: lib.MAX_PAGE_SIZE } });
        return lib.sendArrayOutput({ context, outputType, records: (body && body.data) || [] });
    }
};
