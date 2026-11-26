'use strict';

const lib = require('../lib');

// The output contract of one hotel. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-hotel.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { name, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Hotels' });
        }

        // Source call: this component backs the Hotel dropdown of the other components. The designer
        // fires those calls in bursts, so the answer is cached, and an error shows an empty dropdown
        // (the ID can still be typed) instead of an error popup.
        if (context.properties.isSource) {
            try {
                return context.sendJson({ result: await lib.listHotelsCached(context) }, 'out');
            } catch (err) {
                return context.sendJson({ result: [] }, 'out');
            }
        }

        const { records } = await lib.fetchPage(context, {
            path: '/hotels', size: lib.MAX_PAGE_SIZE, label: 'the list of hotels'
        });

        // The API has no name filter. The name is matched within the one page that was read.
        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        const hotels = records.map(lib.mapHotel)
            .filter(hotel => !needle || String(hotel.name || '').toLowerCase().includes(needle));

        if (hotels.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: hotels });
    },

    toSelectArray({ result }) {

        return (result || []).map(hotel => ({
            label: hotel.name ? `${hotel.name} (${hotel.id})` : String(hotel.id),
            value: String(hotel.id)
        }));
    }
};
