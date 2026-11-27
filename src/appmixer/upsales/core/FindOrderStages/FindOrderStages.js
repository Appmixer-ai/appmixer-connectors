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
            title: 'Stage ID',
            example: 9
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Prospect 1'
        },
        probability: {
            type: 'integer',
            title: 'Probability',
            example: 25
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    // https://api.upsales.com/ - Opportunity & Order stages: GET /orderstages
    async receive(context) {

        const { probability, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Stages', value: 'result' });
        }

        const query = {
            probability: probability === undefined || probability === null || probability === '' ? undefined : Number(probability),
            limit: lib.MAX_PAGE_SIZE
        };

        const { items } = await lib.list(context, '/orderstages', query);

        if (!items.length) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
