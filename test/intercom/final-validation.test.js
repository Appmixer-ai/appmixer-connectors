const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createMockContext } = require('../utils');
const httpRequest = require('./httpRequest');

// Make createMockContext available globally
global.createMockContext = createMockContext;

describe('Intercom Final Component Validation', () => {

    let context;

    beforeEach(() => {
        context = global.createMockContext({
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            httpRequest: httpRequest
        });
    });

    describe('Additional Component Tests', () => {
        const RetrieveContact = require('../../src/appmixer/intercom/core/RetrieveContact/RetrieveContact');
        const UpdateContact = require('../../src/appmixer/intercom/core/UpdateContact/UpdateContact');

        it('should validate RetrieveContact requires ID', async () => {
            context.messages = {
                in: {
                    content: {}
                }
            };

            try {
                await RetrieveContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof context.CancelError, 'Should throw CancelError');
                assert(error.message.includes('Contact ID is required'), 'Should mention ID is required');
            }
        });

        it('should validate UpdateContact requires ID', async () => {
            context.messages = {
                in: {
                    content: {
                        name: 'Test Name'
                    }
                }
            };

            try {
                await UpdateContact.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error instanceof context.CancelError, 'Should throw CancelError');
                assert(error.message.includes('Contact ID is required'), 'Should mention ID is required');
            }
        });
    });

    describe('Component Structure Validation', () => {
        it('should have all required components present', () => {
            const fs = require('fs');
            const componentDir = path.join(__dirname, '../../src/appmixer/intercom/core');
            
            const expectedComponents = [
                'CreateContact',
                'FindContacts', 
                'RetrieveContact',
                'UpdateContact',
                'CreateCompany',
                'FindCompanies',
                'RetrieveCompany', 
                'UpdateCompany',
                'FindConversations',
                'RetrieveConversation',
                'CreateConversation',
                'ReplytoConversation',
                'SendMessage'
            ];

            const actualComponents = fs.readdirSync(componentDir);
            
            expectedComponents.forEach(component => {
                assert(actualComponents.includes(component), `Component ${component} should exist`);
                
                // Check that both .js and component.json files exist
                const componentPath = path.join(componentDir, component);
                const files = fs.readdirSync(componentPath);
                assert(files.includes(`${component}.js`), `${component}.js should exist`);
                assert(files.includes('component.json'), `${component}/component.json should exist`);
            });
        });
    });
});