const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('UpdateProject', () => {
    let component;
    
    before(() => {
        component = require('../../src/appmixer/vercel/core/UpdateProject/UpdateProject');
    });

    it('should update project with provided fields', async () => {
        const projectId = 'test-project-id';
        const newName = 'updated-project-name';
        
        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        name: newName,
                        framework: 'react'
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert.strictEqual(options.method, 'PATCH');
                assert(options.url.includes(`/v9/projects/${projectId}`));
                assert(options.data);
                assert.strictEqual(options.data.name, newName);
                assert.strictEqual(options.data.framework, 'react');
                
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

    it('should throw error when ID is missing', async () => {
        const context = {
            messages: {
                in: {
                    content: {
                        name: 'new-name'
                    }
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

    it('should only include defined fields in request body', async () => {
        const projectId = 'test-project-id';
        
        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        name: 'new-name'
                        // Other fields are undefined/null
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.data);
                assert.strictEqual(options.data.name, 'new-name');
                assert(!options.data.hasOwnProperty('devCommand'));
                assert(!options.data.hasOwnProperty('buildCommand'));
                
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

    it('should handle boolean values correctly', async () => {
        const projectId = 'test-project-id';
        
        const context = {
            messages: {
                in: {
                    content: {
                        id: projectId,
                        publicSource: false
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                assert(options.data);
                assert.strictEqual(options.data.publicSource, false);
                
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
