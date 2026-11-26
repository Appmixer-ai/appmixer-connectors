'use strict';

const lib = require('../../lib');

// The output contract of one day of availability. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-availability.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            publisherCode, hotelCode, roomTypeCode, startDate, range, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Availability' });
        }

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }
        if (lib.isEmpty(roomTypeCode)) {
            throw new context.CancelError('Room Type is required!');
        }

        const records = await lib.fetchList(context, {
            segments: [
                ...lib.hotelSegments(context, { publisherCode, hotelCode }),
                'roomTypes', lib.pathSegment(context, roomTypeCode, 'Room Type'), 'availability'
            ],
            params: {
                startDate: lib.toDateOnly(context, startDate, 'Start Date'),
                range: lib.toRange(context, range)
            },
            label: 'the availability'
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
