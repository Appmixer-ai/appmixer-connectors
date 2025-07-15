const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('CreateProject', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/CreateProject/CreateProject');
    });

    it('should create a project with required name', async () => {
        const projectName = `test-project-${Date.now()}`;

        const context = {
            messages: {
                in: {
                    content: {
                        name: projectName,
                        framework: 'nextjs'
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'POST');
                assert(options.url.includes('/v9/projects'));
                assert(options.data);
                assert.strictEqual(options.data.name, projectName);
                assert.strictEqual(options.data.framework, 'nextjs');

                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers,
                    body: JSON.stringify(options.data)
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

    it('should throw error when name is missing', async () => {
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
            assert.fail('Expected error for missing name');
        } catch (error) {
            assert(error.message.includes('Project name is required'));
        }
    });

    it('should handle team parameter', async () => {
        const projectName = `test-team-project-${Date.now()}`;
        const teamId = 'team_test123';

        const context = {
            messages: {
                in: {
                    content: {
                        name: projectName,
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
                    headers: options.headers,
                    body: JSON.stringify(options.data)
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
