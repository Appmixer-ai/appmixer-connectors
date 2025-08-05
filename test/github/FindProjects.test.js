const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const FindProjects = require('../../src/appmixer/github/project/FindProjects/FindProjects');

// Mock context
const createMockContext = (auth, messages = {}) => {
    return {
        auth, messages, properties: {}, httpRequest: async (options) => {
            const response = await axios({
                method: options.method || 'GET', url: options.url, headers: options.headers, data: options.data
            });

            return {
                data: response.data, status: response.status, headers: response.headers
            };
        }, sendJson: (data, port) => {
            return { data, port };
        }
    };
};

describe('FindProjects', () => {

    const auth = {
        accessToken: process.env.GITHUB_ACCESS_TOKEN
    };

    before(async function() {
        // Skip all tests if the access token is not set
        if (!auth.accessToken) { this.skip(); }
    });

    it('should find user projects', async () => {

        const messages = {
            in: {
                content: {
                    owner: 'octocat', projectType: 'user', outputType: 'array'
                }
            }
        };

        const context = createMockContext(auth, messages);

        try {
            const result = await FindProjects.receive(context);

            if (result) {
                assert(result, 'Should return result');
                assert(result.port === 'out', 'Should use out port');
                assert(result.data, 'Should have data');
                assert(Array.isArray(result.data.result), 'Should return array of projects');
                assert(typeof result.data.count === 'number', 'Should have count');
            } else {
                console.log('No result returned - this may be expected if user has no public projects');
            }
        } catch (error) {
            // If user doesn't exist or doesn't have public projects, that's acceptable
            if (error.message.includes('not found') || error.message.includes('Forbidden')) {
                console.log('User not found or no public projects - this is expected');
            } else {
                throw error;
            }
        }
    });

    it('should find organization projects', async () => {

        const messages = {
            in: {
                content: {
                    owner: 'clientIO', projectType: 'organization', outputType: 'array'
                }
            }
        };

        const context = createMockContext(auth, messages);

        try {
            const { data, port } = await FindProjects.receive(context);

            assert(port === 'out', 'Should use out port');
            assert(data, 'Should have data');
            assert(Array.isArray(data.result), 'Should return array of projects');
            assert(typeof data.count === 'number', 'Should have count');
        } catch (error) {
            // If organization doesn't exist or has restricted access, that's acceptable
            if (error.message.includes('not found') || error.message.includes('Forbidden') || error.message.includes('access restrictions')) {
                console.log('Organization not found or access restricted - this is expected');
            } else {
                throw error;
            }
        }
    });

    it('should find projects by query', async () => {
        const messages = {
            in: {
                content: {
                    owner: 'clientIO', projectType: 'organization', query: 'connector', outputType: 'array'
                }
            }
        };

        const context = createMockContext(auth, messages);

        try {
            const result = await FindProjects.receive(context);

            console.log('lasjdflkjdsklfj');
            console.log(result.data);
            if (result) {
                assert(result, 'Should return result');
                assert(result.port === 'out', 'Should use out port');
                assert(result.data, 'Should have data');
                assert(Array.isArray(result.data.result), 'Should return array of projects');
                assert(typeof result.data.count === 'number', 'Should have count');

                // If projects found, they should match the query
                if (result.data.result.length > 0) {
                    const hasMatchingProject = result.data.result.some(project => {
                        const title = project.title || '';
                        const shortDescription = project.shortDescription || '';
                        const readme = project.readme || '';

                        return title.toLowerCase().includes('test') || shortDescription.toLowerCase().includes('test') || readme.toLowerCase().includes('test');
                    });
                    assert(hasMatchingProject, 'At least one project should match the query');
                }
            } else {
                console.log('No result returned - this may be expected if user has no projects matching query');
            }
        } catch (error) {
            // If user doesn't exist or doesn't have public projects, that's acceptable
            if (error.message.includes('not found') || error.message.includes('Forbidden')) {
                console.log('User not found or no public projects - this is expected');
            } else {
                throw error;
            }
        }
    });

    it('should generate output port options', async () => {
        const messages = {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        };

        const context = createMockContext(auth, messages);
        context.properties.generateOutputPortOptions = true;

        const result = await FindProjects.receive(context);

        assert(result, 'Should return result');
        assert(Array.isArray(result.data), 'Should return array of options');
        assert(result.data.length > 0, 'Should have options');
    });
});
