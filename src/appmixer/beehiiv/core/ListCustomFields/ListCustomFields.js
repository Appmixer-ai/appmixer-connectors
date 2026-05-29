'use strict';

const api = require('../../api');
const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Field ID' },
    display: { type: 'string', title: 'Name' },
    kind: { type: 'string', title: 'Kind' },
    created: { type: 'integer', title: 'Created' }
};

module.exports = {

    async receive(context) {

        const { publicationId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Custom Fields', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index6.execute(context, { publicationId });
        const customFields = result.data || [];

        return lib.sendArrayOutput({ context, outputType, records: customFields });
    }
};
