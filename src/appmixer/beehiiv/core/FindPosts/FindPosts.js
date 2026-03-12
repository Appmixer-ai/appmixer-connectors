'use strict';

const api = require('../../api');
const lib = require('../../lib');

const SCHEMA = {
    id: { type: 'string', title: 'Post ID' },
    title: { type: 'string', title: 'Title' },
    status: { type: 'string', title: 'Status' },
    web_url: { type: 'string', title: 'Web URL' },
    created: { type: 'integer', title: 'Created' }
};

module.exports = {

    async receive(context) {

        const { publicationId, status, audience, limit, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, SCHEMA, { label: 'Posts', value: 'result' });
        }

        if (!publicationId) {
            throw new context.CancelError('Publication ID is required!');
        }

        const params = { publicationId, limit };
        if (status && status !== 'all') params.status = status;
        if (audience && audience !== 'all') params.audience = audience;

        const result = await api.Index9.execute(context, params);
        const items = result.data || [];

        if (items.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: items });
    }
};
