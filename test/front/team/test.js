'use strict';

const assert = require('assert');

describe('Front Team Module', function() {

    describe('Module Structure', function() {
        it('should have all required team components', function() {
            const listComponent = require('../../../src/appmixer/front/team/ListTeams/ListTeams.js');
            const getComponent = require('../../../src/appmixer/front/team/GetTeam/GetTeam.js');
            const addTeammatesComponent = require('../../../src/appmixer/front/team/AddTeammatesToTeam/AddTeammatesToTeam.js');
            const deleteTeammatesComponent = require('../../../src/appmixer/front/team/DeleteTeammatesFromTeam/DeleteTeammatesFromTeam.js');

            assert(typeof listComponent.receive === 'function', 'ListTeams should have receive function');
            assert(typeof getComponent.receive === 'function', 'GetTeam should have receive function');
            assert(typeof addTeammatesComponent.receive === 'function', 'AddTeammatesToTeam should have receive function');
            assert(typeof deleteTeammatesComponent.receive === 'function', 'DeleteTeammatesFromTeam should have receive function');
        });

        it('should have properly named components', function() {
            const listManifest = require('../../../src/appmixer/front/team/ListTeams/component.json');
            const getManifest = require('../../../src/appmixer/front/team/GetTeam/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/team/AddTeammatesToTeam/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/team/DeleteTeammatesFromTeam/component.json');

            assert(listManifest.name === 'appmixer.front.team.ListTeams', 'ListTeams name should match');
            assert(getManifest.name === 'appmixer.front.team.GetTeam', 'GetTeam name should match');
            assert(addTeammatesManifest.name === 'appmixer.front.team.AddTeammatesToTeam', 'AddTeammatesToTeam name should match');
            assert(deleteTeammatesManifest.name === 'appmixer.front.team.DeleteTeammatesFromTeam', 'DeleteTeammatesFromTeam name should match');
        });

        it('should have proper authentication configuration', function() {
            const listManifest = require('../../../src/appmixer/front/team/ListTeams/component.json');
            const getManifest = require('../../../src/appmixer/front/team/GetTeam/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/team/AddTeammatesToTeam/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/team/DeleteTeammatesFromTeam/component.json');

            assert(listManifest.auth.service === 'appmixer:front', 'ListTeams auth should be correct');
            assert(getManifest.auth.service === 'appmixer:front', 'GetTeam auth should be correct');
            assert(addTeammatesManifest.auth.service === 'appmixer:front', 'AddTeammatesToTeam auth should be correct');
            assert(deleteTeammatesManifest.auth.service === 'appmixer:front', 'DeleteTeammatesFromTeam auth should be correct');
        });

        it('should have proper quota configuration', function() {
            const listManifest = require('../../../src/appmixer/front/team/ListTeams/component.json');
            const getManifest = require('../../../src/appmixer/front/team/GetTeam/component.json');
            const addTeammatesManifest = require('../../../src/appmixer/front/team/AddTeammatesToTeam/component.json');
            const deleteTeammatesManifest = require('../../../src/appmixer/front/team/DeleteTeammatesFromTeam/component.json');

            assert(listManifest.quota && listManifest.quota.manager === 'appmixer:front', 'ListTeams quota should be configured');
            assert(getManifest.quota && getManifest.quota.manager === 'appmixer:front', 'GetTeam quota should be configured');
            assert(addTeammatesManifest.quota && addTeammatesManifest.quota.manager === 'appmixer:front', 'AddTeammatesToTeam quota should be configured');
            assert(deleteTeammatesManifest.quota && deleteTeammatesManifest.quota.manager === 'appmixer:front', 'DeleteTeammatesFromTeam quota should be configured');
        });
    });
});
