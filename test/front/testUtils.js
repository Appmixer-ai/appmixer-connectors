// Utility functions for Front tests
const axios = require('axios');

const RATE_LIMIT_DELAY = 1000; // 1s delay between requests to be safe with Front API limits

/**
 * Add a delay to respect Front's rate limiting
 */
async function rateLimitDelay() {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
}

/**
 * Simple httpRequest wrapper for tests
 */
async function httpRequest(config) {
    try {
        const response = await axios(config);
        return {
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        if (error.response) {
            // Server responded with error status
            const newError = new Error(error.message);
            newError.response = {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            };
            throw newError;
        }
        throw error;
    }
}

/**
 * Create a standard test context for Front components
 */
function createTestContext(apiToken, messages = {}) {
    return {
        auth: {
            accessToken: apiToken
        },
        properties: {},
        messages: {
            in: messages
        },
        httpRequest,
        sendJson: function(data, outputPort) {
            this.lastSent = { data, outputPort };
            return Promise.resolve();
        },
        saveFileStream: async function(stream, filename) {
            // Mock file save for tests
            return Promise.resolve({ fileId: 'mock_file_id' });
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
    httpRequest,
    RATE_LIMIT_DELAY
};
