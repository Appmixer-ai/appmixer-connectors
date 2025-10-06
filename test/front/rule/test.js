'use strict';

const assert = require('assert');

describe('Front Rule Module', function() {

    describe('Module Structure', function() {
        it('should have all required rule components', function() {
            const listComponent = require('../../../src/appmixer/front/rule/ListRules/ListRules.js');
            const getComponent = require('../../../src/appmixer/front/rule/GetRule/GetRule.js');

            assert(typeof listComponent.receive === 'function', 'ListRules should have receive function');
            assert(typeof getComponent.receive === 'function', 'GetRule should have receive function');
        });

        it('should have properly named components', function() {
            const listManifest = require('../../../src/appmixer/front/rule/ListRules/component.json');
            const getManifest = require('../../../src/appmixer/front/rule/GetRule/component.json');

            assert(listManifest.name === 'appmixer.front.rule.ListRules', 'ListRules name should match');
            assert(getManifest.name === 'appmixer.front.rule.GetRule', 'GetRule name should match');
        });

        it('should have proper authentication configuration', function() {
            const listManifest = require('../../../src/appmixer/front/rule/ListRules/component.json');
            const getManifest = require('../../../src/appmixer/front/rule/GetRule/component.json');

            assert(listManifest.auth.service === 'appmixer:front', 'ListRules auth should be correct');
            assert(getManifest.auth.service === 'appmixer:front', 'GetRule auth should be correct');
        });

        it('should have proper quota configuration', function() {
            const listManifest = require('../../../src/appmixer/front/rule/ListRules/component.json');
            const getManifest = require('../../../src/appmixer/front/rule/GetRule/component.json');

            assert(listManifest.quota && listManifest.quota.manager === 'appmixer:front', 'ListRules quota should be configured');
            assert(getManifest.quota && getManifest.quota.manager === 'appmixer:front', 'GetRule quota should be configured');
        });
    });
});
