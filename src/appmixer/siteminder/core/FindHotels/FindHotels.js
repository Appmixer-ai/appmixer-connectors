'use strict';

const lib = require('../../lib');

// The output contract of one hotel. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-hotel.json');

const fetchHotels = (context, publisherCode) => {

    return lib.fetchList(context, {
        segments: ['publishers', lib.pathSegment(context, publisherCode, 'Publisher'), 'hotels'],
        label: 'the list of hotels'
    });
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { publisherCode, name, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Hotels' });
        }

        // Source call: this component backs the Hotel dropdown of the other components. Without a
        // publisher there is nothing to list yet.
        if (context.properties.isSource) {
            if (lib.isEmpty(publisherCode)) {
                return context.sendJson({ result: [] }, 'out');
            }
            return lib.sendSource(context, { source: 'hotels', publisherCode: String(publisherCode).trim() },
                () => fetchHotels(context, publisherCode));
        }

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }

        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        const hotels = (await fetchHotels(context, publisherCode)).filter(hotel => !needle
            || String((hotel && hotel.name) || '').toLowerCase().includes(needle)
            || String((hotel && hotel.code) || '').toLowerCase().includes(needle));

        if (hotels.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: hotels });
    },

    toSelectArray({ result }) {

        return (result || [])
            .filter(hotel => hotel && hotel.code)
            .map(hotel => ({
                label: hotel.name ? `${hotel.name} (${hotel.code})` : String(hotel.code),
                value: String(hotel.code)
            }));
    }
};
