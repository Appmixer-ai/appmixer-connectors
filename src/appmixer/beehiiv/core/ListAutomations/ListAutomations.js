'use strict';

const api = require('../../api');
const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Automation ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' }
};

module.exports = {

    async receive(context) {

        const { publicationId, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Automations', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const result = await api.Index3.execute(context, { publicationId });
        const automations = result.data || [];

        return lib.sendArrayOutput({ context, outputType, records: automations });
    }
};
