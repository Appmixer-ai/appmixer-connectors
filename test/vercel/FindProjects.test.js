const assert = require('assert');

describe('FindProjects', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/FindProjects/FindProjects');
    });

    it('should find projects and return array output', async () => {
        const mockProjects = {
            projects: [
                {
                    id: 'prj_test123',
                    name: 'test-project',
                    framework: 'nextjs',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                },
                {
                    id: 'prj_test456',
                    name: 'another-project',
                    framework: 'react',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
            ],
            pagination: { count: 2, next: null, prev: null }
        };

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate request structure
                assert.strictEqual(options.method, 'GET');
                assert(options.url.includes('/v9/projects'));
                assert(options.headers['Authorization'].includes('Bearer'));

                return { data: mockProjects };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                assert.strictEqual(data.count, 2);
                assert.strictEqual(data.result.length, 2);
                assert.strictEqual(data.result[0].id, 'prj_test123');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should handle search filter', async () => {
        const mockProjects = {
            projects: [
                {
                    id: 'prj_search_test',
                    name: 'test-search-project',
                    framework: 'vue'
                }
            ],
            pagination: { count: 1, next: null, prev: null }
        };

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        search: 'test',
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: 'mock_token'
            },
            CancelError: Error,
            httpRequest: async (options) => {
                // Validate that search parameter is included in URL
                assert(options.url.includes('search=test'));
                assert.strictEqual(options.method, 'GET');

                return { data: mockProjects };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should generate output port options', async () => {
        const context = {
            properties: {
                generateOutputPortOptions: true
            },
            messages: {
                in: {
                    content: {
                        outputType: 'array'
                    }
                }
            },
            CancelError: Error,
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(Array.isArray(data));
                assert(data.length > 0);
                assert(data[0].label);
                assert(data[0].value);
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
