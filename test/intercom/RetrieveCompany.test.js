const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('RetrieveCompany Component', function() {
    let context;
    let RetrieveCompany;
    let CreateCompany;
    let createdCompanyId;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the components
        RetrieveCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/RetrieveCompany/RetrieveCompany.js'));
        CreateCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateCompany/CreateCompany.js'));

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
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    beforeEach(async function() {
        // Create a test company before each test
        const randomCompanyId = `test-retrieve-company-${Date.now()}`;

        context.messages.in.content = {
            company_id: randomCompanyId,
            name: 'Test Retrieve Company'
        };

        try {
            const createResult = await CreateCompany.receive(context);
            createdCompanyId = createResult.data.id;
        } catch (error) {
            console.error('Error creating test company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should retrieve a company by id', async function() {
        context.messages.in.content = {
            id: createdCompanyId
        };

        try {
            const result = await RetrieveCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.id, 'Should return company id');
            assert.strictEqual(result.data.id, createdCompanyId, 'Should return correct company id');
            assert(result.data.company_id, 'Should return company_id');
        } catch (error) {
            console.error('Error retrieving company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {};

        try {
            await RetrieveCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent company id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-company-id-12345'
        };

        try {
            await RetrieveCompany.receive(context);
            // This might succeed or fail depending on Intercom's behavior
        } catch (error) {
            // If it fails, it should be a 404 error
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent company');
        }
    });
});
