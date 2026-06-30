// Utility functions for Resend tests
const RATE_LIMIT_DELAY = 600; // 600ms delay between requests (2 requests per second limit)

/**
 * Add a delay to respect Resend's rate limiting (2 requests per second)
 */
async function rateLimitDelay() {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

/**
 * Create a standard test context for Resend components
 */
function createTestContext(apiKey, messages = {}) {
    return {
        auth: {
            apiKey: apiKey
        },
        properties: {},
        messages: {
            in: messages
        },
        httpRequest: require('./httpRequest.js'),
        sendJson: function(data, outputPort) {
            this.lastSent = { data, outputPort };
            return Promise.resolve();
        },
        CancelError: class extends Error {
            constructor(message) {
                super(message);
                this.name = 'CancelError';
            }
        }
    };
}

module.exports = {
    rateLimitDelay,
    createTestContext,
    RATE_LIMIT_DELAY
};
