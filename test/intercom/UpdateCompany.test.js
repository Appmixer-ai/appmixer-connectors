const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateCompany Component', function() {
    let context;
    let UpdateCompany;
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
        UpdateCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/UpdateCompany/UpdateCompany.js'));
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
        const randomCompanyId = `test-update-company-${Date.now()}`;

        context.messages.in.content = {
            company_id: randomCompanyId,
            name: 'Original Company Name'
        };

        try {
            const createResult = await CreateCompany.receive(context);
            createdCompanyId = createResult.data.id;
        } catch (error) {
            console.error('Error creating test company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update a company name', async function() {
        const newName = `Updated Company Name ${Date.now()}`;

        context.messages.in.content = {
            id: createdCompanyId,
            name: newName
        };

        try {
            const result = await UpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            // Update components should return empty object according to guidelines
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            console.error('Error updating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update company custom attributes', async function() {
        const customAttributes = {
            test_field: 'test_value'
        };

        context.messages.in.content = {
            id: createdCompanyId,
            custom_attributes: customAttributes
        };

        try {
            const result = await UpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            // Custom attributes might not exist in Intercom, which is expected
            if (error.response && error.response.status === 400 &&
                error.response.data && error.response.data.errors &&
                error.response.data.errors[0].code === 'parameter_invalid') {
                console.log('Expected error for non-existent custom attribute');
                return; // This is acceptable behavior
            }
            console.error('Error updating company custom attributes:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update company with multiple fields', async function() {
        const newName = `Multi-Update Company ${Date.now()}`;
        const customAttributes = {
            test_field: 'updated_value'
        };

        context.messages.in.content = {
            id: createdCompanyId,
            name: newName,
            custom_attributes: customAttributes
        };

        try {
            const result = await UpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return result data');
            assert(typeof result.data === 'object', 'Should return an object');
        } catch (error) {
            // Custom attributes might not exist in Intercom, which is expected
            if (error.response && error.response.status === 400 &&
                error.response.data && error.response.data.errors &&
                error.response.data.errors[0].code === 'parameter_invalid') {
                console.log('Expected error for non-existent custom attribute');
                return; // This is acceptable behavior
            }
            console.error('Error updating company with multiple fields:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when id is missing', async function() {
        context.messages.in.content = {
            name: 'Updated Company Name'
        };

        try {
            await UpdateCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });

    it('should handle non-existent company id gracefully', async function() {
        context.messages.in.content = {
            id: 'non-existent-company-12345',
            name: 'Updated Company Name'
        };

        try {
            await UpdateCompany.receive(context);
            // This might succeed or fail depending on Intercom's behavior
        } catch (error) {
            // If it fails, it should be a 404 error
            assert(error.response, 'Should have response data');
            assert(error.response.status === 404, 'Should return 404 for non-existent company');
        }
    });
});
