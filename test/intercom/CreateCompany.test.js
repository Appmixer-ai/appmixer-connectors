const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateCompany Component', function() {
    let context;
    let CreateCompany;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
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

    it('should create a company with company_id only', async function() {
        const randomCompanyId = `test-company-${Date.now()}`;

        context.messages.in.content = {
            company_id: randomCompanyId
        };

        try {
            const result = await CreateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id, 'Should return company_id');
            assert.strictEqual(result.data.company_id, randomCompanyId, 'Should return correct company_id');
        } catch (error) {
            console.error('Error creating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should create a company with company_id and name', async function() {
        const randomCompanyId = `test-company-${Date.now()}`;
        const companyName = `Test Company ${Date.now()}`;

        context.messages.in.content = {
            company_id: randomCompanyId,
            name: companyName
        };

        try {
            const result = await CreateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id, 'Should return company_id');
            assert.strictEqual(result.data.company_id, randomCompanyId, 'Should return correct company_id');
            assert.strictEqual(result.data.name, companyName, 'Should return correct name');
        } catch (error) {
            console.error('Error creating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should create a company with custom attributes', async function() {
        const randomCompanyId = `test-company-${Date.now()}`;
        // Use simple attributes that might exist or handle the error gracefully
        const customAttributes = {
            test_field: 'test_value'
        };

        context.messages.in.content = {
            company_id: randomCompanyId,
            name: `Test Company with Attributes ${Date.now()}`,
            custom_attributes: customAttributes
        };

        try {
            const result = await CreateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id, 'Should return company_id');
        } catch (error) {
            // Custom attributes might not exist in Intercom, which is expected
            if (error.response && error.response.status === 400 &&
                error.response.data && error.response.data.errors &&
                error.response.data.errors[0].code === 'parameter_invalid') {
                console.log('Expected error for non-existent custom attribute');
                return; // This is acceptable behavior
            }
            console.error('Error creating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should throw error when company_id is missing', async function() {
        context.messages.in.content = {
            name: 'Test Company'
        };

        try {
            await CreateCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });
});
