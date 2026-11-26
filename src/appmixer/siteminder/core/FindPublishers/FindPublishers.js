'use strict';

const lib = require('../../lib');

// The output contract of one publisher. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-publisher.json');

const fetchPublishers = (context) => {

    return lib.fetchList(context, { segments: ['publishers'], label: 'the list of publishers' });
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Publishers' });
        }

        // Source call: this component backs the Publisher dropdown of the other components.
        if (context.properties.isSource) {
            return lib.sendSource(context, { source: 'publishers' }, () => fetchPublishers(context));
        }

        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        const publishers = (await fetchPublishers(context)).filter(publisher => !needle
            || String((publisher && publisher.name) || '').toLowerCase().includes(needle)
            || String((publisher && publisher.code) || '').toLowerCase().includes(needle));

        if (publishers.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: publishers });
    },

    toSelectArray({ result }) {

        return (result || [])
            .filter(publisher => publisher && publisher.code)
            .map(publisher => ({
                label: publisher.name ? `${publisher.name} (${publisher.code})` : String(publisher.code),
                value: String(publisher.code)
            }));
    }
};
