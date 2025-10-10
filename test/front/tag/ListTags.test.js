'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils.js');

describe('ListTags Component', function() {
    let ListTags;

    this.timeout(30000);

    beforeEach(async function() {
        await rateLimitDelay();
    });

    before(async function() {
        if (!process.env.FRONT_API_TOKEN) {
            this.skip();
            return;
        }

        ListTags = require('../../../src/appmixer/front/tag/ListTags/ListTags.js');
        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Component Structure', function() {
        it('should have the correct component structure', function() {
            const manifest = require('../../../src/appmixer/front/tag/ListTags/component.json');

            assert(typeof ListTags.receive === 'function', 'Component should have receive function');
            assert(manifest.name === 'appmixer.front.tag.ListTags', 'Component name should match');
            assert(manifest.auth, 'Component should have auth configuration');
            assert(manifest.inPorts, 'Component should have inPorts');
            assert(manifest.outPorts, 'Component should have outPorts');
        });
    });
});
