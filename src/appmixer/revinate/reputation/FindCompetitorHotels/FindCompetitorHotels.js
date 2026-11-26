'use strict';

const lib = require('../lib');

// The output contract of one hotel. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-hotel.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { hotelId, name, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Hotels' });
        }

        if (!hotelId) {
            throw new context.CancelError('Hotel is required!');
        }
        const id = lib.requireNumericId(context, hotelId, 'Hotel');

        const { records } = await lib.fetchPage(context, {
            path: `/hotels/${id}/competitorhotels`, size: lib.MAX_PAGE_SIZE, label: 'the list of competitor hotels'
        });

        // The API has no name filter. The name is matched within the one page that was read.
        const needle = typeof name === 'string' ? name.trim().toLowerCase() : '';
        const hotels = records.map(lib.mapHotel)
            .filter(hotel => !needle || String(hotel.name || '').toLowerCase().includes(needle));

        if (hotels.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: hotels });
    }
};
