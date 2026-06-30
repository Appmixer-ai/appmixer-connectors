const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { createMockContext } = require('../utils');

describe('CreateKey Component', function() {
    let context;
    let CreateKey;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.UNKEY_ROOT_KEY) {
            console.log('Skipping tests - UNKEY_ROOT_KEY not set');
            this.skip();
        }

        // Load the component
        CreateKey = require(path.join(__dirname, '../../src/appmixer/unkey/core/CreateKey/CreateKey.js'));

        // Mock context
        context = createMockContext();
        context.auth = {
            apiKey: process.env.UNKEY_ROOT_KEY
        };
    });

    it('should validate required apiId field', async function() {
        context.messages = {
            in: {
                content: {
                    // Missing required apiId
                    name: 'Test Key'
                }
            }
        };

        try {
            await CreateKey.receive(context);
            assert.fail('Expected error for missing API ID');
        } catch (error) {
            assert(error.message.includes('API ID'), 'Expected error about API ID');
        }
    });

    it('should handle invalid JSON in metadata', async function() {
        context.messages = {
            in: {
                content: {
                    apiId: 'test-api-id',
                    meta: 'invalid json {'
                }
            }
        };

        try {
            await CreateKey.receive(context);
            assert.fail('Expected error for invalid JSON');
        } catch (error) {
            assert(error.message.includes('JSON'), 'Expected error about JSON');
        }
    });
});
