const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const GetCurrentUser = require('../../src/appmixer/helpscout/core/GetCurrentUser/GetCurrentUser');

// Mock context
const createMockContext = (auth, messages = {}) => {
    return {
        auth,
        messages,
        properties: {},
        httpRequest: async (options) => {
            const response = await axios({
                method: options.method || 'GET',
                url: options.url,
                headers: options.headers,
                data: options.data
            });

            return {
                data: response.data,
                status: response.status,
                headers: response.headers
            };
        },
        sendJson: (data, port) => {
            return { data, port };
        }
    };
};

describe('HelpScout GetCurrentUser', () => {
    const auth = {
        accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should get current user details', async () => {
        const context = createMockContext(auth, {
            in: { content: {} }
        });

        const result = await GetCurrentUser.receive(context);
        
        assert.strictEqual(result.port, 'out');
        assert(result.data, 'Should return user data');
        assert(result.data.id, 'Should have user ID');
        assert(result.data.email, 'Should have user email');
        assert(result.data.firstName, 'Should have user firstName');
        assert(result.data.lastName, 'Should have user lastName');
    });
});