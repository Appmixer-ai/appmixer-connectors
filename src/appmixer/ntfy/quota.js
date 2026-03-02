'use strict';

/**
 * ntfy.sh rate limits depend on your plan:
 *   - Free (unauthenticated): 250 messages/day across all topics
 *   - Supporter: 2,500 messages/day
 *   - Pro: 20,000 messages/day
 *   - Business: 50,000 messages/day
 *   - Self-hosted: no enforced limit
 *
 * We use a conservative shared limit suitable for the free tier.
 * Adjust or remove this quota for higher-tier plans.
 */
module.exports = {

    manager: 'quota',
    maxWait: 60000,

    resources: {
        requests: {
            limit: 60,       // max requests per window
            window: 60000,   // 60 seconds
            queueing: 'fifo'
        }
    }
};
