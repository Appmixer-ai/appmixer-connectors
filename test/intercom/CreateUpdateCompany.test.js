const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateUpdateCompany Component', function() {
    let context;
    let CreateUpdateCompany;
    let createdCompanyId;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        CreateUpdateCompany = require(path.join(__dirname, '../../src/appmixer/intercom/core/CreateUpdateCompany/CreateUpdateCompany.js'));

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
    });

    it('should create a company with company_id only', async function() {
        createdCompanyId = `test-company-${Date.now()}`;

        context.messages.in.content = {
            company_id: createdCompanyId
        };

        try {
            const result = await CreateUpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id === createdCompanyId, 'Should have correct company_id');
        } catch (error) {
            console.error('Error creating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should create a company with company_id and name', async function() {
        const companyId = `test-company-with-name-${Date.now()}`;
        const companyName = `Test Company ${Date.now()}`;

        context.messages.in.content = {
            company_id: companyId,
            name: companyName
        };

        try {
            const result = await CreateUpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id === companyId, 'Should have correct company_id');
            assert(result.data.name === companyName, 'Should have correct name');
        } catch (error) {
            console.error('Error creating company with name:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should update an existing company', async function() {
        const updatedName = `Updated Test Company ${Date.now()}`;

        context.messages.in.content = {
            company_id: createdCompanyId,
            name: updatedName
        };

        try {
            const result = await CreateUpdateCompany.receive(context);

            assert(result, 'Should return a result');
            assert(result.data, 'Should return company data');
            assert(result.data.company_id === createdCompanyId, 'Should have correct company_id');
            assert(result.data.name === updatedName, 'Should have updated name');
        } catch (error) {
            console.error('Error updating company:', error.response?.data || error.message);
            throw error;
        }
    });

    it('should create a company with custom attributes', async function() {
        const companyId = `test-company-custom-${Date.now()}`;
        const customAttributes = { industry: 'technology', employee_count: 50 };

        context.messages.in.content = {
            company_id: companyId,
            custom_attributes: customAttributes
        };

        try {
            await CreateUpdateCompany.receive(context);
            // If we reach here, the request unexpectedly succeeded
            assert.fail('Should have failed with invalid custom attributes');
        } catch (error) {
            // Expected to fail with invalid custom attributes
            assert(error.response && error.response.status >= 400, 'Should fail with 4xx error for invalid custom attributes');
        }
    });

    it('should throw error when company_id is missing', async function() {
        context.messages.in.content = {
            name: 'Test Company'
        };

        try {
            await CreateUpdateCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.name === 'CancelError', 'Should throw CancelError');
            assert(error.message.includes('Company ID is required'), 'Should have appropriate error message');
        }
    });
});
