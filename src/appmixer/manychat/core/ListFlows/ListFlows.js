'use strict';

const lib = require('../../lib');

// The output contract of ONE item. Declared above module.exports (see ITEM_SCHEMA rules).
const ITEM_SCHEMA = {
    type: 'object',
    required: [
        'ns',
        'name'
    ],
    properties: {
        ns: {
            type: 'string',
            title: 'Flow ID',
            example: 'content20260115103000_123456'
        },
        name: {
            type: 'string',
            title: 'Name',
            example: 'Welcome Message'
        },
        folder_id: {
            type: 'integer',
            title: 'Folder ID',
            example: 0
        }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Flows' });
        }

        try {
            // Inspector dropdowns fire in bursts: serve them from a short cache.
            const data = context.properties.isSource
                ? await lib.requestCached(context, '/fb/page/getFlows')
                : await lib.request(context, { path: '/fb/page/getFlows' });
            const records = (data && Array.isArray(data.flows)) ? data.flows : [];
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

        return (result || []).map(item => ({ label: item.name, value: String(item.ns) }));
    }
};
