'use strict';

const assert = require('assert');

describe('Front Tags Module', function() {

    describe('Module Structure', function() {
        it('should have all required tag components', function() {
            const createComponent = require('../../../src/appmixer/front/tag/CreateTag/CreateTag.js');
            const getComponent = require('../../../src/appmixer/front/tag/GetTag/GetTag.js');
            const listComponent = require('../../../src/appmixer/front/tag/ListTags/ListTags.js');
            const updateComponent = require('../../../src/appmixer/front/tag/UpdateTag/UpdateTag.js');
            const deleteComponent = require('../../../src/appmixer/front/tag/DeleteTag/DeleteTag.js');

            assert(typeof createComponent.receive === 'function', 'CreateTag should have receive function');
            assert(typeof getComponent.receive === 'function', 'GetTag should have receive function');
            assert(typeof listComponent.receive === 'function', 'ListTags should have receive function');
            assert(typeof updateComponent.receive === 'function', 'UpdateTag should have receive function');
            assert(typeof deleteComponent.receive === 'function', 'DeleteTag should have receive function');
        });

        it('should have properly named components', function() {
            const createManifest = require('../../../src/appmixer/front/tag/CreateTag/component.json');
            const getManifest = require('../../../src/appmixer/front/tag/GetTag/component.json');
            const listManifest = require('../../../src/appmixer/front/tag/ListTags/component.json');
            const updateManifest = require('../../../src/appmixer/front/tag/UpdateTag/component.json');
            const deleteManifest = require('../../../src/appmixer/front/tag/DeleteTag/component.json');

            assert(createManifest.name === 'appmixer.front.tag.CreateTag', 'CreateTag name should match');
            assert(getManifest.name === 'appmixer.front.tag.GetTag', 'GetTag name should match');
            assert(listManifest.name === 'appmixer.front.tag.ListTags', 'ListTags name should match');
            assert(updateManifest.name === 'appmixer.front.tag.UpdateTag', 'UpdateTag name should match');
            assert(deleteManifest.name === 'appmixer.front.tag.DeleteTag', 'DeleteTag name should match');
        });

        it('should have proper authentication configuration', function() {
            const createManifest = require('../../../src/appmixer/front/tag/CreateTag/component.json');
            const getManifest = require('../../../src/appmixer/front/tag/GetTag/component.json');
            const listManifest = require('../../../src/appmixer/front/tag/ListTags/component.json');
            const updateManifest = require('../../../src/appmixer/front/tag/UpdateTag/component.json');
            const deleteManifest = require('../../../src/appmixer/front/tag/DeleteTag/component.json');

            assert(createManifest.auth.service === 'appmixer:front', 'CreateTag auth should be correct');
            assert(getManifest.auth.service === 'appmixer:front', 'GetTag auth should be correct');
            assert(listManifest.auth.service === 'appmixer:front', 'ListTags auth should be correct');
            assert(updateManifest.auth.service === 'appmixer:front', 'UpdateTag auth should be correct');
            assert(deleteManifest.auth.service === 'appmixer:front', 'DeleteTag auth should be correct');
        });
    });
});
