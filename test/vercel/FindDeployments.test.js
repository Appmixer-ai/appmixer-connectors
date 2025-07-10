const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('FindDeployments', () => {
    let component;

    before(() => {
        component = require('../../src/appmixer/vercel/core/FindDeployments/FindDeployments');
    });

    it('should find deployments and return array output', async () => {
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
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
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
                assert(data.result);
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                return Promise.resolve();
            }
        };

        await component.receive(context);
    });

    it('should handle project filter', async () => {
        const projectId = 'test-project';

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        projectId: projectId,
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.url.includes(`projectId=${projectId}`));

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

    it('should handle state and target filters', async () => {
        const state = 'READY';
        const target = 'production';

        const context = {
            properties: {},
            messages: {
                in: {
                    content: {
                        state: state,
                        target: target,
                        outputType: 'array'
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.url.includes(`state=${state}`));
                assert(options.url.includes(`target=${target}`));

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
