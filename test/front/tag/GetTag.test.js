'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils.js');

describe('GetTag Component', function() {
    let context;
    let GetTag;

    this.timeout(30000);

    // Add delay between tests to respect rate limiting
    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        // Skip all tests if the API token is not set
        if (!process.env.FRONT_API_TOKEN) {
            this.skip();
            return;
        }

        GetTag = require('../../../src/appmixer/front/tag/GetTag/GetTag.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/tag/GetTag/component.json');

            assert(typeof GetTag.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.tag.GetTag', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require tag ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await GetTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Tag ID is required'), 'Should require tag ID');
            }
        });
    });
});
