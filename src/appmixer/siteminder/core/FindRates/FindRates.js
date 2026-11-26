'use strict';

const lib = require('../../lib');

// The output contract of one rate. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../../schema-rate.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            publisherCode, hotelCode, ratePlanCode, startDate, range, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Rates' });
        }

        if (lib.isEmpty(publisherCode)) {
            throw new context.CancelError('Publisher is required!');
        }
        if (lib.isEmpty(hotelCode)) {
            throw new context.CancelError('Hotel is required!');
        }
        if (lib.isEmpty(ratePlanCode)) {
            throw new context.CancelError('Rate Plan is required!');
        }

        const records = await lib.fetchList(context, {
            segments: [
                ...lib.hotelSegments(context, { publisherCode, hotelCode }),
                'ratePlans', lib.pathSegment(context, ratePlanCode, 'Rate Plan'), 'rates'
            ],
            params: {
                startDate: lib.toDateOnly(context, startDate, 'Start Date'),
                range: lib.toRange(context, range)
            },
            label: 'the rates'
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
