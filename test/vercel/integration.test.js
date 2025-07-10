const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('Vercel Integration Tests', () => {
    let createdProjectId;
    
    before(function() {
        if (!process.env.VERCEL_API_TOKEN) {
            this.skip('VERCEL_API_TOKEN not found in environment variables');
        }
    });

    it('should create a new project', async () => {
        const CreateProject = require('../../src/appmixer/vercel/core/CreateProject/CreateProject');
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
                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers,
                    body: options.data ? JSON.stringify(options.data) : undefined
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }
                
                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert(data.id);
                assert.strictEqual(data.name, projectName);
                createdProjectId = data.id;
                return Promise.resolve();
            }
        };

        await CreateProject.receive(context);
        assert(createdProjectId, 'Project ID should be set');
    });

    it('should find projects including the created one', async () => {
        const FindProjects = require('../../src/appmixer/vercel/core/FindProjects/FindProjects');
        
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
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }
                
                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data.result);
                assert(Array.isArray(data.result));
                assert(typeof data.count === 'number');
                
                // Check if our created project is in the list
                const foundProject = data.result.find(p => p.id === createdProjectId);
                assert(foundProject, `Created project ${createdProjectId} should be found in projects list`);
                
                return Promise.resolve();
            }
        };

        await FindProjects.receive(context);
    });

    it('should get the specific project by ID', async () => {
        const GetProject = require('../../src/appmixer/vercel/core/GetProject/GetProject');
        
        const context = {
            messages: {
                in: {
                    content: {
                        id: createdProjectId
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
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }
                
                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.id, createdProjectId);
                return Promise.resolve();
            }
        };

        await GetProject.receive(context);
    });

    it('should update the project', async () => {
        const UpdateProject = require('../../src/appmixer/vercel/core/UpdateProject/UpdateProject');
        const newName = `updated-project-${Date.now()}`;
        
        const context = {
            messages: {
                in: {
                    content: {
                        id: createdProjectId,
                        name: newName
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_API_TOKEN
            },
            httpRequest: async (options) => {
                const response = await fetch(options.url, {
                    method: options.method,
                    headers: options.headers,
                    body: options.data ? JSON.stringify(options.data) : undefined
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }
                
                return { data: await response.json() };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                assert(data);
                assert.strictEqual(data.name, newName);
                return Promise.resolve();
            }
        };

        await UpdateProject.receive(context);
    });

    it('should find deployments', async () => {
        const FindDeployments = require('../../src/appmixer/vercel/core/FindDeployments/FindDeployments');
        
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
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
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

        await FindDeployments.receive(context);
    });

    after(async () => {
        // Clean up: delete the created project
        if (createdProjectId) {
            const DeleteProject = require('../../src/appmixer/vercel/core/DeleteProject/DeleteProject');
            
            const context = {
                messages: {
                    in: {
                        content: {
                            id: createdProjectId
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
                        const errorText = await response.text();
                        console.warn(`Failed to delete test project: HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                    }
                    
                    return { data: response.ok ? await response.json() : {} };
                },
                sendJson: (data, port) => {
                    return Promise.resolve();
                }
            };

            try {
                await DeleteProject.receive(context);
                console.log(`Cleaned up test project: ${createdProjectId}`);
            } catch (error) {
                console.warn(`Failed to clean up test project: ${error.message}`);
            }
        }
    });
});
