'use strict';

const path = require('path');
const assert = require('assert');

describe('Front Drafts Module', function() {

    // Test the individual components
    require('./CreateDraft.test.js');
    require('./GetDraft.test.js');
    require('./ListDrafts.test.js');
    require('./UpdateDraft.test.js');
    require('./DeleteDraft.test.js');

    describe('Module Integration', function() {
        it('should have all required draft components', function() {
            const componentPaths = [
                '../../../src/appmixer/front/drafts/CreateDraft/CreateDraft.js',
                '../../../src/appmixer/front/drafts/GetDraft/GetDraft.js',
                '../../../src/appmixer/front/drafts/ListDrafts/ListDrafts.js',
                '../../../src/appmixer/front/drafts/UpdateDraft/UpdateDraft.js',
                '../../../src/appmixer/front/drafts/DeleteDraft/DeleteDraft.js'
            ];

            componentPaths.forEach(componentPath => {
                const component = require(path.join(__dirname, componentPath));
                assert.strictEqual(typeof component, 'object');
                assert.strictEqual(typeof component.receive, 'function');
            });
        });

        it('should have all component.json files with correct structure', function() {
            const componentConfigs = [
                '../../../src/appmixer/front/drafts/CreateDraft/component.json',
                '../../../src/appmixer/front/drafts/GetDraft/component.json',
                '../../../src/appmixer/front/drafts/ListDrafts/component.json',
                '../../../src/appmixer/front/drafts/UpdateDraft/component.json',
                '../../../src/appmixer/front/drafts/DeleteDraft/component.json'
            ];

            componentConfigs.forEach(configPath => {
                const config = require(path.join(__dirname, configPath));

                // Verify basic structure
                assert.strictEqual(typeof config.name, 'string');
                assert(config.name.startsWith('appmixer.front.drafts.'));
                assert.strictEqual(typeof config.description, 'string');
                assert.strictEqual(config.author, 'Appmixer <info@appmixer.com>');
                assert.strictEqual(config.version, '1.0.0');

                // Verify auth configuration
                assert.strictEqual(typeof config.auth, 'object');
                assert.strictEqual(config.auth.service, 'appmixer:front');

                // Verify quota configuration if present
                if (config.quota) {
                    assert.strictEqual(config.quota.manager, 'appmixer:front');
                    assert.strictEqual(config.quota.resources, 'requests');
                }

                // Verify ports structure
                assert(Array.isArray(config.inPorts));
                assert(config.inPorts.length > 0);
                assert(Array.isArray(config.outPorts) || config.outPorts === undefined);
            });
        });

        it('should have proper naming convention for components', function() {
            const expectedComponents = [
                'appmixer.front.drafts.CreateDraft',
                'appmixer.front.drafts.GetDraft',
                'appmixer.front.drafts.ListDrafts',
                'appmixer.front.drafts.UpdateDraft',
                'appmixer.front.drafts.DeleteDraft'
            ];

            const componentPaths = [
                '../../../src/appmixer/front/drafts/CreateDraft/component.json',
                '../../../src/appmixer/front/drafts/GetDraft/component.json',
                '../../../src/appmixer/front/drafts/ListDrafts/component.json',
                '../../../src/appmixer/front/drafts/UpdateDraft/component.json',
                '../../../src/appmixer/front/drafts/DeleteDraft/component.json'
            ];

            componentPaths.forEach((configPath, index) => {
                const config = require(path.join(__dirname, configPath));
                assert.strictEqual(config.name, expectedComponents[index]);
            });
        });
    });

    describe('CRUD Operations Coverage', function() {
        it('should cover all CRUD operations', function() {
            const requiredOperations = ['Create', 'Get', 'List', 'Update', 'Delete'];
            const availableComponents = ['CreateDraft', 'GetDraft', 'ListDrafts', 'UpdateDraft', 'DeleteDraft'];

            // Verify we have components for all CRUD operations
            requiredOperations.forEach(operation => {
                let hasOperation = false;
                availableComponents.forEach(component => {
                    if (component.includes(operation) || (operation === 'Read' && (component.includes('Get') || component.includes('List')))) {
                        hasOperation = true;
                    }
                });
                assert(hasOperation, `Missing ${operation} operation for drafts`);
            });
        });

        it('should have proper input validation for all components', function() {
            const componentConfigs = [
                { path: '../../../src/appmixer/front/drafts/CreateDraft/component.json', requiredField: 'body' },
                { path: '../../../src/appmixer/front/drafts/GetDraft/component.json', requiredField: 'draftId' },
                { path: '../../../src/appmixer/front/drafts/ListDrafts/component.json', requiredField: null },
                { path: '../../../src/appmixer/front/drafts/UpdateDraft/component.json', requiredField: 'draftId' },
                { path: '../../../src/appmixer/front/drafts/DeleteDraft/component.json', requiredField: 'draftId' }
            ];

            componentConfigs.forEach(({ path: configPath, requiredField }) => {
                const config = require(path.join(__dirname, configPath));

                if (requiredField) {
                    // Check if required field is marked as required
                    const inPort = config.inPorts[0];
                    assert(inPort.schema.required.includes(requiredField),
                        `${requiredField} should be required in ${configPath}`);
                }

                // Check input port structure
                const inPort = config.inPorts[0];
                assert.strictEqual(typeof inPort.schema, 'object');
                assert.strictEqual(typeof inPort.schema.properties, 'object');
                assert.strictEqual(typeof inPort.inspector, 'object');
                assert.strictEqual(typeof inPort.inspector.inputs, 'object');
            });
        });
    });
});
