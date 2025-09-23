'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('Intercom AddContactToCompany Component', function() {

    let context;
    let AddContactToCompany;

    this.timeout(30000);

    before(function() {
        // Skip all tests if environment variables are not set
        if (!process.env.INTERCOM_ACCESS_TOKEN) {
            console.log('Skipping tests - INTERCOM_ACCESS_TOKEN not set');
            this.skip();
        }

        // Load the component
        AddContactToCompany = require('../../src/appmixer/intercom/core/AddContactToCompany/AddContactToCompany');
    });

    beforeEach(function() {
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
            httpRequest: require('./httpRequest'),
            sendJson: function(data, port) {
                this.response = { data, port };
                return { data, port };
            },
            CancelError: class extends Error {
                constructor(msg) {
                    super(msg);
                    this.name = 'CancelError';
                }
            }
        };
    });

    it('should require contact_id', async function() {
        context.messages.in.content = {
            company_id: 'test_company_id'
        };

        try {
            await AddContactToCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('Contact ID is required'));
        }
    });

    it('should require company_id', async function() {
        context.messages.in.content = {
            contact_id: 'test_contact_id'
        };

        try {
            await AddContactToCompany.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert.strictEqual(error.name, 'CancelError');
            assert(error.message.includes('Company ID is required'));
        }
    });

    it('should attach contact to company successfully', async function() {
        context.messages.in.content = {
            contact_id: 'valid_contact_id',
            company_id: 'valid_company_id'
        };

        await AddContactToCompany.receive(context);

        assert(context.response, 'Should have sent a response');
        assert.strictEqual(context.response.port, 'out');
        assert(context.response.data, 'Should have response data');
    });
});
