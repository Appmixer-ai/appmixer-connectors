'use strict';

const lib = require('../../lib');

// The output contract of one room type. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-room-type.json');

const fetchRoomTypes = async (context, input) => {

    const records = await lib.fetchList(context, {
        segments: [...lib.hotelSegments(context, input), 'roomTypes'],
        label: 'the list of room types'
    });
    return records.map(lib.withLocalizedName);
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { publisherCode, hotelCode, outputType } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Room Types' });
        }

        // Source call: this component backs the room type dropdown of the other components. Without a
        // publisher and a hotel there is nothing to list yet.
        if (context.properties.isSource) {
            if (lib.isEmpty(publisherCode) || lib.isEmpty(hotelCode)) {
                return context.sendJson({ result: [] }, 'out');
            }
            return lib.sendSource(context, {
                source: 'room-types',
                publisherCode: String(publisherCode).trim(),
                hotelCode: String(hotelCode).trim()
            }, () => fetchRoomTypes(context, { publisherCode, hotelCode }));
        }

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }

        const records = await fetchRoomTypes(context, { publisherCode, hotelCode });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    },

    toSelectArray({ result }) {

        return (result || [])
            .filter(item => item && item.code)
            .map(item => ({
                label: item.name ? `${item.name} (${item.code})` : String(item.code),
                value: String(item.code)
            }));
    }
};
