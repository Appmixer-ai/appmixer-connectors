const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetCompany Component', function() {
    let context;
    let GetCompany;
    let testCompanyId;
    let testIntercomId;

    this.timeout(30000);

    before(async function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/GetCompany/GetCompany.js'));

        // Mock context
        context = {
            auth: {
                accessToken: process.env.INTERCOM_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            log: function(level, message, data) {
                if (level === 'error') {
                    console.error(`[${level}] ${message}`, data || '');
                }
            },
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        // Create a test company first
        try {
            testCompanyId = `test-get-company-${Date.now()}`;
            const CreateUpdateCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateUpdateCompany/CreateUpdateCompany.js'));

            const createContext = { ...context };
            createContext.messages = {
                in: {
                    content: {
                        company_id: testCompanyId,
                        name: 'Test Company for Get'
                    }
                }
            };

            const createResult = await CreateUpdateCompany.receive(createContext);
            testIntercomId = createResult.data.id; // Store the Intercom ID
        } catch (error) {
            console.error('Error creating test company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should retrieve a company by id', async function() {
        context.messages.in.content = {
            id: testIntercomId
        };

        try {
            const result = await GetCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id === testCompanyId, 'Should return correct company');
        } catch (error) {
            console.error('Error retrieving company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await GetCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent company id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-company-12345'
        };

        try {
            await GetCompany.receive(context);
            assert.fail('Should have thrown an error for non-existent company');
        } catch (error) {
            assert(error.response && error.response.status === 404, 'Should return 404 for non-existent company');
        }
    });
});
