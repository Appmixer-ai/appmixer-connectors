'use strict';

const lib = require('../../lib');

// The output contract of ONE item. Declared above module.exports (see ITEM_SCHEMA rules).
const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'id',
        'name'
    ],
    properties: {
        id: {
            type: 'integer',
            title: 'Tag ID',
            example: 98765
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'VIP'
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tags' });
        }

        try {
            // Inspector dropdowns fire in bursts: serve them from a short cache.
            const data = context.properties.isSource
                ? await lib.requestCached(context, '/fb/page/getTags')
                : await lib.request(context, { path: '/fb/page/getTags' });
            const records = Array.isArray(data) ? data : [];
            return lib.sendArrayOutput({ context, outputType, records });
        } catch (err) {
            if (context.properties.isSource) {
                return context.sendJson({ result: [], count: 0 }, 'out');
            }
            throw err;
        }
    },

    /**
     * Inspector dropdown options from the 'array' output.
     * @param {{ result: object[] }} output
     * @returns {{ label: string, value: string }[]}
     */
    toSelectArray({ result }) {

        return (result || []).map(item => ({ label: item.name, value: String(item.id) }));
    }
};
