'use strict';

const api = require('../../api');
const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Segment ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' },
    type: { type: 'string', title: 'Type' },
    count: { type: 'integer', title: 'Subscriber Count' },
    created_at: { type: 'string', title: 'Created At' },
    updated_at: { type: 'string', title: 'Updated At' }
};

module.exports = {

    async receive(context) {

        const { publicationId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Segments', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index12.execute(context, { publicationId });
        const segments = result.data || [];

        return lib.sendArrayOutput({ context, outputType, records: segments });
    }
};
