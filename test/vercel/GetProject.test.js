const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('GetProject', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/GetProject/GetProject');
    });

    it('should get project by ID', async () => {
        const projectId = 'test-project-id';

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'GET');
                assert(options.url.includes(`/v9/projects/${projectId}`));

                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert(typeof data === 'object');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should throw error when ID is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {}
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            }
        };

        try {
            await component.receive(context);
            assert.fail('Expected error for missing ID');
        } catch (error) {
            assert(error.message.includes('Project ID is required'));
        }
    });

    it('should handle team parameter', async () => {
        const projectId = 'test-project-id';
        const teamId = 'team_test123';

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        teamId: teamId
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.url.includes(`teamId=${teamId}`));

                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should properly encode project ID in URL', async () => {
        const projectId = 'project with spaces';

        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.url.includes(encodeURIComponent(projectId)));

                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });
});
