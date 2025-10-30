const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const ListMailboxes = require('../../src/appmixer/helpscout/core/ListMailboxes/ListMailboxes');

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

describe('HelpScout ListMailboxes', () => {
    const auth = {
        accessToken: process.env.HELPSCOUT_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should list mailboxes with array output', async () => {
        const context = createMockContext(auth, {
            in: { content: { outputType: 'array' } }
        });

        await ListMailboxes.receive(context);
        const result = context.getSentData();
        
        assert.strictEqual(result.port, 'out');
        assert(result.data, 'Should return mailboxes data');
        assert(result.data.result, 'Should have result property');
        assert(Array.isArray(result.data.result), 'Result should be an array');
    });

    it('should list mailboxes with first output', async () => {
        const context = createMockContext(auth, {
            in: { content: { outputType: 'first' } }
        });

        await ListMailboxes.receive(context);
        const result = context.getSentData();
        
        assert.strictEqual(result.port, 'out');
        assert(result.data, 'Should return mailbox data');
        assert(result.data.id, 'Should have mailbox ID');
        assert(result.data.name, 'Should have mailbox name');
    });
});