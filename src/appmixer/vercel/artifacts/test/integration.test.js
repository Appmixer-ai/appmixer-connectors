const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../../test/.env') });

describe('Vercel Integration Tests', () => {
    let createdProjectId;
    let originalProjectData;

    before(function() {
        if (!process.env.VERCEL_ACCESS_TOKEN) {
            this.skip('VERCEL_ACCESS_TOKEN not found in environment variables');
        }
    });

    it('should create a new project', async function() {
        this.timeout(10000); // Increase timeout for API calls

        const CreateProject = require('../../core/CreateProject/CreateProject');
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
                apiToken: process.env.VERCEL_ACCESS_TOKEN
            },
            httpRequest: async (options) => {
                const url = new URL(options.url);
                if (options.params) {
                    Object.keys(options.params).forEach(key => {
                        url.searchParams.append(key, options.params[key]);
                    });
                }

                const response = await fetch(url.toString(), {
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
                originalProjectData = data;
                console.log(`✅ Created project: ${projectName} (ID: ${createdProjectId})`);
                return data;
            }
        };

        const result = await CreateProject.receive(context);
        assert(createdProjectId, 'Project ID should be set');
        assert(result, 'Should return project data');
    });

    it('should update all available project fields', async function() {
        this.timeout(10000); // Increase timeout for API calls

        if (!createdProjectId) {
            this.skip('No project created to update');
        }

        const UpdateProject = require('../../core/UpdateProject/UpdateProject');
        const timestamp = Date.now();

        // Define all the updated values
        const updatedValues = {
            id: createdProjectId,
            name: `updated-project-${timestamp}`,
            devCommand: 'npm run dev-updated',
            buildCommand: 'npm run build-updated',
            outputDirectory: 'dist-updated',
            publicSource: true // Toggle from original value
        };

        const context = {
            messages: {
                in: {
                    content: updatedValues
                }
            },
            auth: {
                apiToken: process.env.VERCEL_ACCESS_TOKEN
            },
            httpRequest: async (options) => {
                const url = new URL(options.url);
                if (options.params) {
                    Object.keys(options.params).forEach(key => {
                        url.searchParams.append(key, options.params[key]);
                    });
                }

                const response = await fetch(url.toString(), {
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
                console.log(`✅ Updated project: ${updatedValues.name} (ID: ${createdProjectId})`);
                return data;
            }
        };

        const updateResult = await UpdateProject.receive(context);
        assert(updateResult, 'Should return updated project data');

        // Now verify all updates by getting the project
        const GetProject = require('../../core/GetProject/GetProject');

        const getContext = {
            messages: {
                in: {
                    content: {
                        id: createdProjectId
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_ACCESS_TOKEN
            },
            httpRequest: async (options) => {
                const url = new URL(options.url);
                if (options.params) {
                    Object.keys(options.params).forEach(key => {
                        url.searchParams.append(key, options.params[key]);
                    });
                }

                const response = await fetch(url.toString(), {
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
                assert.strictEqual(data.id, createdProjectId);

                // Assert all updated fields
                console.log('🔍 Verifying updated fields:');

                // Check name
                assert.strictEqual(data.name, updatedValues.name,
                    `Expected name to be '${updatedValues.name}' but got '${data.name}'`);
                console.log(`  ✅ name: ${data.name}`);

                // Check devCommand
                assert.strictEqual(data.devCommand, updatedValues.devCommand,
                    `Expected devCommand to be '${updatedValues.devCommand}' but got '${data.devCommand}'`);
                console.log(`  ✅ devCommand: ${data.devCommand}`);

                // Check buildCommand
                assert.strictEqual(data.buildCommand, updatedValues.buildCommand,
                    `Expected buildCommand to be '${updatedValues.buildCommand}' but got '${data.buildCommand}'`);
                console.log(`  ✅ buildCommand: ${data.buildCommand}`);

                // Check outputDirectory
                assert.strictEqual(data.outputDirectory, updatedValues.outputDirectory,
                    `Expected outputDirectory to be '${updatedValues.outputDirectory}' but got '${data.outputDirectory}'`);
                console.log(`  ✅ outputDirectory: ${data.outputDirectory}`);

                // Check publicSource
                assert.strictEqual(data.publicSource, updatedValues.publicSource,
                    `Expected publicSource to be ${updatedValues.publicSource} but got ${data.publicSource}`);
                console.log(`  ✅ publicSource: ${data.publicSource}`);

                // Verify updatedAt timestamp has changed
                assert(data.updatedAt > originalProjectData.updatedAt,
                    'updatedAt timestamp should be newer than original');
                console.log(`  ✅ updatedAt: ${new Date(data.updatedAt).toISOString()} (updated)`);

                console.log('🎉 All fields successfully updated and verified!');
                return data;
            }
        };

        const getResult = await GetProject.receive(getContext);
        assert(getResult, 'Should return project data from GetProject');
    });

    it('should delete the project', async function() {
        this.timeout(10000); // Increase timeout for API calls

        if (!createdProjectId) {
            this.skip('No project created to delete');
        }

        const DeleteProject = require('../../core/DeleteProject/DeleteProject');

        const context = {
            messages: {
                in: {
                    content: {
                        id: createdProjectId
                    }
                }
            },
            auth: {
                apiToken: process.env.VERCEL_ACCESS_TOKEN
            },
            httpRequest: async (options) => {
                const url = new URL(options.url);
                if (options.params) {
                    Object.keys(options.params).forEach(key => {
                        url.searchParams.append(key, options.params[key]);
                    });
                }

                const response = await fetch(url.toString(), {
                    method: options.method,
                    headers: options.headers,
                    body: options.data ? JSON.stringify(options.data) : undefined
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                // Delete operations might return empty responses
                let data = {};
                try {
                    const text = await response.text();
                    if (text) {
                        data = JSON.parse(text);
                    }
                } catch (e) {
                    // Empty response is okay for delete operations
                }

                return { data };
            },
            sendJson: (data, port) => {
                assert.strictEqual(port, 'out');
                console.log(`✅ Deleted project: ${createdProjectId}`);
                return data;
            }
        };

        await DeleteProject.receive(context);
        console.log(`🧹 Cleanup completed for project: ${createdProjectId}`);

        // Reset the project ID since it's been deleted
        createdProjectId = null;
    });
});
