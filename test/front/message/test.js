'use strict';

const assert = require('assert');

describe('Front Message Module', function() {

    describe('Module Structure', function() {
        it('should have all required message components', function() {
            const getComponent = require('../../../src/appmixer/front/message/GetMessage/GetMessage.js');
            const createComponent = require('../../../src/appmixer/front/message/CreateMessage/CreateMessage.js');
            const replyComponent = require('../../../src/appmixer/front/message/ReplyMessage/ReplyMessage.js');

            assert(typeof getComponent.receive === 'function', 'GetMessage should have receive function');
            assert(typeof createComponent.receive === 'function', 'CreateMessage should have receive function');
            assert(typeof replyComponent.receive === 'function', 'ReplyMessage should have receive function');
        });

        it('should have properly named components', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            assert(getManifest.name === 'appmixer.front.message.GetMessage', 'GetMessage name should match');
            assert(createManifest.name === 'appmixer.front.message.CreateMessage', 'CreateMessage name should match');
            assert(replyManifest.name === 'appmixer.front.message.ReplyMessage', 'ReplyMessage name should match');
        });

        it('should have proper authentication configuration', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            assert(getManifest.auth.service === 'appmixer:front', 'GetMessage auth should be correct');
            assert(createManifest.auth.service === 'appmixer:front', 'CreateMessage auth should be correct');
            assert(replyManifest.auth.service === 'appmixer:front', 'ReplyMessage auth should be correct');
        });

        it('should have proper quota configuration', function() {
            const getManifest = require('../../../src/appmixer/front/message/GetMessage/component.json');
            const createManifest = require('../../../src/appmixer/front/message/CreateMessage/component.json');
            const replyManifest = require('../../../src/appmixer/front/message/ReplyMessage/component.json');

            assert(getManifest.quota && getManifest.quota.manager === 'appmixer:front', 'GetMessage quota should be configured');
            assert(createManifest.quota && createManifest.quota.manager === 'appmixer:front', 'CreateMessage quota should be configured');
            assert(replyManifest.quota && replyManifest.quota.manager === 'appmixer:front', 'ReplyMessage quota should be configured');
        });
    });
});
