'use strict';

const assert = require('assert');

describe('Front Inbox Module', function() {

    describe('Module Structure', function() {
        it('should have all required inbox components', function() {
            const listComponent = require('../../../src/appmixer/front/inbox/ListInboxes/ListInboxes.js');
            const getComponent = require('../../../src/appmixer/front/inbox/GetInbox/GetInbox.js');
            const createComponent = require('../../../src/appmixer/front/inbox/CreateInbox/CreateInbox.js');
            const addTeammatesComponent = require('../../../src/appmixer/front/inbox/AddTeammatesToInbox/AddTeammatesToInbox.js');
            const deleteTeammatesComponent = require('../../../src/appmixer/front/inbox/DeleteTeammatesFromInbox/DeleteTeammatesFromInbox.js');

            assert(typeof listComponent.receive === 'function', 'ListInboxes should have receive function');
            assert(typeof getComponent.receive === 'function', 'GetInbox should have receive function');
            assert(typeof createComponent.receive === 'function', 'CreateInbox should have receive function');
            assert(typeof addTeammatesComponent.receive === 'function', 'AddTeammatesToInbox should have receive function');
            assert(typeof deleteTeammatesComponent.receive === 'function', 'DeleteTeammatesFromInbox should have receive function');
        });

        it('should have properly named components', function() {
            const listManifest = require('../../../src/appmixer/front/inbox/ListInboxes/component.json');
            const getManifest = require('../../../src/appmixer/front/inbox/GetInbox/component.json');
            const createManifest = require('../../../src/appmixer/front/inbox/CreateInbox/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/inbox/AddTeammatesToInbox/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/inbox/DeleteTeammatesFromInbox/component.json');

            assert(listManifest.name === 'appmixer.front.inbox.ListInboxes', 'ListInboxes name should match');
            assert(getManifest.name === 'appmixer.front.inbox.GetInbox', 'GetInbox name should match');
            assert(createManifest.name === 'appmixer.front.inbox.CreateInbox', 'CreateInbox name should match');
            assert(addTeammatesManifest.name === 'appmixer.front.inbox.AddTeammatesToInbox', 'AddTeammatesToInbox name should match');
            assert(deleteTeammatesManifest.name === 'appmixer.front.inbox.DeleteTeammatesFromInbox', 'DeleteTeammatesFromInbox name should match');
        });

        it('should have proper authentication configuration', function() {
            const listManifest = require('../../../src/appmixer/front/inbox/ListInboxes/component.json');
            const getManifest = require('../../../src/appmixer/front/inbox/GetInbox/component.json');
            const createManifest = require('../../../src/appmixer/front/inbox/CreateInbox/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/inbox/AddTeammatesToInbox/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/inbox/DeleteTeammatesFromInbox/component.json');

            assert(listManifest.auth.service === 'appmixer:front', 'ListInboxes auth should be correct');
            assert(getManifest.auth.service === 'appmixer:front', 'GetInbox auth should be correct');
            assert(createManifest.auth.service === 'appmixer:front', 'CreateInbox auth should be correct');
            assert(addTeammatesManifest.auth.service === 'appmixer:front', 'AddTeammatesToInbox auth should be correct');
            assert(deleteTeammatesManifest.auth.service === 'appmixer:front', 'DeleteTeammatesFromInbox auth should be correct');
        });

        it('should have proper quota configuration', function() {
            const listManifest = require('../../../src/appmixer/front/inbox/ListInboxes/component.json');
            const getManifest = require('../../../src/appmixer/front/inbox/GetInbox/component.json');
            const createManifest = require('../../../src/appmixer/front/inbox/CreateInbox/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/inbox/AddTeammatesToInbox/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/inbox/DeleteTeammatesFromInbox/component.json');

            assert(listManifest.quota && listManifest.quota.manager === 'appmixer:front', 'ListInboxes quota should be configured');
            assert(getManifest.quota && getManifest.quota.manager === 'appmixer:front', 'GetInbox quota should be configured');
            assert(createManifest.quota && createManifest.quota.manager === 'appmixer:front', 'CreateInbox quota should be configured');
            assert(addTeammatesManifest.quota && addTeammatesManifest.quota.manager === 'appmixer:front', 'AddTeammatesToInbox quota should be configured');
            assert(deleteTeammatesManifest.quota && deleteTeammatesManifest.quota.manager === 'appmixer:front', 'DeleteTeammatesFromInbox quota should be configured');
        });
    });
});
