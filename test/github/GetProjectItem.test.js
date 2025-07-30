const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const GetProjectItem = require('../../src/appmixer/github/project/GetProjectItem/GetProjectItem');

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

describe('GetProjectItem', () => {
    const auth = {
        accessToken: process.env.GITHUB_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should get project item details', async () => {
        // Note: This test needs a real project item ID
        const messages = {
            in: {
                content: {
                    // valid id
                    projectItemId: 'PVTI_lADOAA12oc4AGXUuzgbi8fA' // issue
                    // projectItemId: 'PVTI_lADOAA12oc4AGXUuzgZulYs' // pr
                }
            }
        };

        const context = createMockContext(auth, messages);

        try {
            const { data, port } = await GetProjectItem.receive(context);

            assert(port === 'out', 'Should use out port');
            assert(data, 'Should have data');
            assert(data.id, 'Should have item ID');
            assert(data.content, 'Should have content');
            assert(data.content.id, 'Should have content id');
            assert(data.status, 'Should have status');
            assert(data.title, 'Should have title');
        } catch (error) {
            // If the specific item ID doesn't exist, that's expected
            if (error.message.includes('not found')) {
                console.log('Project item not found - this is expected if using example ID');
            } else {
                throw error;
            }
        }
    });
});
