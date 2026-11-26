'use strict';

const lib = require('../lib');

// The output contract of one review. Exported because the output port is dynamic.
const ITEM_SCHEMA = require('../schema-review.json');

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            hotelId, collectedFrom, collectedTo, updatedFrom, updatedTo, sortBy, sortDirection, outputType, ...filters
        } = (context.messages.in && context.messages.in.content) || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Reviews' });
        }

        // One request: GET /reviews (all hotels) or GET /hotels/{hotelId}/reviews.
        const { records } = await lib.fetchPage(context, {
            path: lib.reviewsPath(context, hotelId),
            params: {
                ...lib.reviewFilters(context, filters),
                dateCollected: lib.toDateRange(context, collectedFrom, collectedTo, 'Collected'),
                updatedAt: lib.toDateRange(context, updatedFrom, updatedTo, 'Updated'),
                // Sent only when asked for: Revinate sorts only for API keys enabled for it.
                sort: sortBy ? `${sortBy},${sortDirection === 'ASC' ? 'ASC' : 'DESC'}` : undefined
            },
            size: lib.REVIEW_PAGE_SIZE,
            label: 'the list of reviews'
        });

        if (records.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: records.map(lib.mapReview) });
    }
};
