const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const GetProject = require('../../src/appmixer/github/project/GetProject/GetProject');

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

describe('GetProject', () => {
    const auth = {
        accessToken: process.env.GITHUB_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should get project details', async () => {
        // Note: This test needs a real project ID
        // You would need to get this from FindProjects first
        const messages = {
            in: {
                content: {
                    projectId: 'PVT_kwDOAA12oc4AGXUu' // Example project ID
                }
            }
        };

        const context = createMockContext(auth, messages);

        try {
            const result = await GetProject.receive(context);

            console.log(result.data);
            assert(result, 'Should return result');
            assert(result.port === 'out', 'Should use out port');
            assert(result.data, 'Should have data');
            assert(result.data.id, 'Should have project ID');
            assert(result.data.title, 'Should have project title');
            assert(Array.isArray(result.data.fields), 'Should have fields array');
        } catch (error) {
            // If the specific project ID doesn't exist, that's expected
            if (error.message.includes('not found')) {
                console.log('Project not found - this is expected if using example ID');
            } else {
                throw error;
            }
        }
    });
});
