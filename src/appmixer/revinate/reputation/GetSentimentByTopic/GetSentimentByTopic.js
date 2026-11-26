'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { hotelId, topicCategoryId, reviewSiteSlug, startDate, endDate } = context.messages.in.content;

        if (!hotelId) {
            throw new context.CancelError('Hotel is required!');
        }

        const id = lib.requireNumericId(context, hotelId, 'Hotel');
        const snapshot = await lib.fetchObject(context, {
            label: 'the sentiment by topic',
            path: `/hotels/${id}/topicssnapshot`,
            params: {
                topicCategoryId: lib.isEmpty(topicCategoryId)
                    ? undefined
                    : lib.requireNumericId(context, topicCategoryId, 'Topic Category ID'),
                date: lib.toDateRange(context, startDate, endDate, 'Date'),
                reviewSiteSlug: lib.isEmpty(reviewSiteSlug) ? undefined : String(reviewSiteSlug).trim()
            }
        });

        return context.sendJson(snapshot, 'out');
    }
};
