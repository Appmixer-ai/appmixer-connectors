'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id'
    ],
    properties: {
        id: {
            type: 'integer',
            title: 'User ID',
            example: 1
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Gustav Petterson'
        },
        email: {
            type: 'string',
            title: 'Email',
            example: 'gustav@example.com'
        },
        active: {
            type: 'integer',
            title: 'Active',
            example: 1
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Users: GET /users
    async receive(context) {

        const { name, email, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Users', value: 'result' });
        }

        const query = {
            name,
            email,
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/users', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
