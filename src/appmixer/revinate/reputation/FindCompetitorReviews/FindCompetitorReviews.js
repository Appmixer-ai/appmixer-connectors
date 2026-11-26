'use strict';

const lib = require('../lib');

// The output contract of one review. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-review.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            hotelId, competitorHotelSlug, collectedFrom, collectedTo, updatedFrom, updatedTo,
            sortBy, sortDirection, outputType
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Reviews' });
        }

        if (!hotelId) {
            throw new context.CancelError('Hotel is required!');
        }
        const id = lib.requireNumericId(context, hotelId, 'Hotel');

        const { records } = await lib.fetchPage(context, {
            path: `/hotels/${id}/competitorreviews`,
            params: {
                competitorHotelSlug: lib.isEmpty(competitorHotelSlug) ? undefined : String(competitorHotelSlug).trim(),
                dateCollected: lib.toDateRange(context, collectedFrom, collectedTo, 'Collected'),
                updatedAt: lib.toDateRange(context, updatedFrom, updatedTo, 'Updated'),
                // Sent only when asked for: Revinate sorts only for API keys enabled for it.
                sort: sortBy ? `${sortBy},${sortDirection === 'ASC' ? 'ASC' : 'DESC'}` : undefined
            },
            size: lib.REVIEW_PAGE_SIZE,
            label: 'the list of competitor reviews'
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: records.map(lib.mapReview) });
    }
};
