'use strict';

const lib = require('../lib');

// A review fires every time its update time moves.
const TIME_FIELD = 'updatedAt';

// The same review fires again when it changes again, so the update time is part of the key.
const updateKey = (review) => `${lib.reviewKey(review)}@${review[TIME_FIELD]}`;

module.exports = {

    // The Porter API has no webhooks, so the reviews are polled.
    async tick(context) {

        // Skipped while the previous check is still running.
        return lib.runExclusive(context, async () => {

            const { emit, state, truncated } = await lib.pollReviews(context, {
                timeField: TIME_FIELD,
                getKey: updateKey,
                properties: context.properties
            });

            for (const review of emit) {
                await context.sendJson(review, 'out');
            }

            if (truncated) {
                await context.log({
                    step: 'truncated',
                    message: 'More reviews changed at once than one check reads. The rest was skipped.'
                });
            }

            if (state) {
                await context.saveState(state);
            }
        });
    },

    // Flow Test Mode: emit the most recently updated matching review. Read-only, no state writes.
    async test(context) {

        const review = await lib.fetchLatestReview(context, { timeField: TIME_FIELD, properties: context.properties });

        if (!review) {
            throw new context.CancelError('No review matches the trigger settings yet. Widen the filters, or try '
                + 'again once Revinate has collected a review.');
        }

        return context.sendJson(review, 'out');
    }
};
