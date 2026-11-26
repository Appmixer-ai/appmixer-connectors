'use strict';

const lib = require('../lib');

module.exports = {

    async receive(context) {

        const { reviewId } = context.messages.in.content;

        if (!reviewId) {
            throw new context.CancelError('Review ID is required!');
        }

        const id = lib.requireNumericId(context, reviewId, 'Review ID');
        const review = await lib.fetchObject(context, { path: `/reviews/${id}`, label: 'the review' });

        // The representation has no ID of its own; it is the one that was asked for.
        return context.sendJson({ id: Number(id), ...lib.mapReview(review) }, 'out');
    }
};
