'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils.js');

describe('DeleteTag Component', function() {
    let context;
    let DeleteTag;

    this.timeout(30000);

    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        if (!process.env.FRONT_API_TOKEN) {
            this.skip();
            return;
        }

        DeleteTag = require('../../../src/appmixer/front/tag/DeleteTag/DeleteTag.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/tag/DeleteTag/component.json');

            assert(typeof DeleteTag.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.tag.DeleteTag', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });

    describe('Input Validation', function() {
        it('should require tag ID', async function() {
            context.messages = { in: { content: {} } };

            try {
                await DeleteTag.receive(context);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert(error.message.includes('Tag ID is required'), 'Should require tag ID');
            }
        });
    });
});
