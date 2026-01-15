'use strict';

/**
 * Google Ads API quota management
 * 
 * Google Ads API has rate limits that vary by account type:
 * - Standard: 15,000 operations per day
 * - Manager accounts: Higher limits based on account tier
 * 
 * This component implements retry logic with exponential backoff
 * to handle rate limiting gracefully.
 */

module.exports = {
    // Google Ads API quota limits (approximate)
    requests: {
        quota: 15000,
        window: 86400000, // 24 hours in milliseconds
        throttling: 'adaptive-backoff'
    }
};
