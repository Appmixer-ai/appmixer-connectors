'use strict';

/**
 * ntfy.sh rate limits depend on your plan:
 *   - Free (unauthenticated): 250 messages/day across all topics
 *   - Supporter: 2,500 messages/day
 *   - Pro: 20,000 messages/day
 *   - Self-hosted: no enforced limit
 *
 * Conservative limit suitable for the free tier.
 */
module.exports = {

    rules: [
        {
            limit: 60,
            window: 60000,
            throttling: 'window-sliding',
            queueing: 'fifo',
            resource: 'requests'
        }
    ]
};
