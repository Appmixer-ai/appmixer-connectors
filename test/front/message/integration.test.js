'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const assert = require('assert');
const { rateLimitDelay, createTestContext } = require('../testUtils');

describe('Front Message Integration', function() {

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

        context = createTestContext(process.env.FRONT_API_TOKEN);
    });

    describe('Basic Integration', function() {
        it('should have message module integrated', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            // Verify all components exist and have proper structure
            assert(getManifest.name, 'GetMessage should have a name');
            assert(createManifest.name, 'CreateMessage should have a name');
            assert(replyManifest.name, 'ReplyMessage should have a name');

            // Verify all use Front authentication
            assert(getManifest.auth.service === 'appmixer:front', 'GetMessage should use Front auth');
            assert(createManifest.auth.service === 'appmixer:front', 'CreateMessage should use Front auth');
            assert(replyManifest.auth.service === 'appmixer:front', 'ReplyMessage should use Front auth');
        });

        it('should have consistent output port structure', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            // All components should have 'out' port
            assert(getManifest.outPorts.some(port => port.name === 'out'), 'GetMessage should have out port');
            assert(createManifest.outPorts.some(port => port.name === 'out'), 'CreateMessage should have out port');
            assert(replyManifest.outPorts.some(port => port.name === 'out'), 'ReplyMessage should have out port');

            // All should have message ID in output options
            const getOutPort = getManifest.outPorts.find(port => port.name === 'out');
            const createOutPort = createManifest.outPorts.find(port => port.name === 'out');
            const replyOutPort = replyManifest.outPorts.find(port => port.name === 'out');

            assert(getOutPort.options.some(opt => opt.value === 'id'), 'GetMessage should output message ID');
            assert(createOutPort.options.some(opt => opt.value === 'id'), 'CreateMessage should output message ID');
            assert(replyOutPort.options.some(opt => opt.value === 'id'), 'ReplyMessage should output message ID');
        });

        it('should have proper input validation structure', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            // GetMessage should require ID
            assert(getManifest.inPorts[0].schema.required.includes('id'), 'GetMessage should require id');

            // CreateMessage should require channel_id, to, and body
            assert(createManifest.inPorts[0].schema.required.includes('channel_id'), 'CreateMessage should require channel_id');
            assert(createManifest.inPorts[0].schema.required.includes('to'), 'CreateMessage should require to');
            assert(createManifest.inPorts[0].schema.required.includes('body'), 'CreateMessage should require body');

            // ReplyMessage should require conversation_id and body
            assert(replyManifest.inPorts[0].schema.required.includes('conversation_id'), 'ReplyMessage should require conversation_id');
            assert(replyManifest.inPorts[0].schema.required.includes('body'), 'ReplyMessage should require body');
        });
    });
});
