const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const FindCustomers = require('../../src/appmixer/helpscout/core/FindCustomers/FindCustomers');

// Mock context
const createMockContext = (auth, messages = {}) => {
    let sentData = null;
    let sentPort = null;

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
            sentData = data;
            sentPort = port;
            return Promise.resolve();
        },
        getSentData: () => ({ data: sentData, port: sentPort })
    };
};

describe('HelpScout FindCustomers', () => {
    const auth = {
        accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should find customers with basic query', async () => {
        const context = createMockContext(auth, {
            in: {
                content: {
                    query: 'email:*',
                    outputType: 'array'
                }
            }
        });

        await FindCustomers.receive(context);
        const result = context.getSentData();
        
        assert.strictEqual(result.port, 'out');
        assert(result.data, 'Should return customers data');
        assert(result.data.result, 'Should have result property');
        assert(Array.isArray(result.data.result), 'Result should be an array');
    });

    it('should handle first output type', async () => {
        const context = createMockContext(auth, {
            in: {
                content: {
                    query: 'email:*',
                    outputType: 'first'
                }
            }
        });

        await FindCustomers.receive(context);
        const result = context.getSentData();
        
        assert.strictEqual(result.port, 'out');
        assert(result.data, 'Should return customer data');
        // First result may have additional properties like index, count
    });
});