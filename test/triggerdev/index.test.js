const assert = require('assert');

describe('Trigger.dev Connector', () => {

    it('should have all required files', () => {
        const auth = require('../../src/appmixer/triggerdev/auth');
        const lib = require('../../src/appmixer/triggerdev/lib');
        const quota = require('../../src/appmixer/triggerdev/quota');

        assert(auth, 'Auth module should exist');
        assert(lib, 'Lib module should exist');
        assert(quota, 'Quota module should exist');

        // Verify auth structure
        assert.strictEqual(auth.type, 'apiKey', 'Auth type should be apiKey');
        assert(auth.definition, 'Auth should have definition');
        assert(auth.definition.auth, 'Auth should have auth fields');
        assert(auth.definition.auth.apiKey, 'Auth should have apiKey field');
        assert(auth.definition.auth.baseUrl, 'Auth should have baseUrl field');

        // Verify lib structure
        assert.strictEqual(typeof lib.sendArrayOutput, 'function', 'Lib should have sendArrayOutput function');
        assert.strictEqual(typeof lib.getOutputPortOptions, 'function', 'Lib should have getOutputPortOptions function');

        // Verify quota structure
        assert(Array.isArray(quota.rules), 'Quota should have rules array');
        assert(quota.rules.length > 0, 'Quota should have at least one rule');
    });

    it('should load all component modules', () => {
        const ListRuns = require('../../src/appmixer/triggerdev/core/ListRuns/ListRuns');
        const GetRun = require('../../src/appmixer/triggerdev/core/GetRun/GetRun');
        const CancelRun = require('../../src/appmixer/triggerdev/core/CancelRun/CancelRun');
        const ReplayRun = require('../../src/appmixer/triggerdev/core/ReplayRun/ReplayRun');
        const ListTasks = require('../../src/appmixer/triggerdev/core/ListTasks/ListTasks');
        const ListProjects = require('../../src/appmixer/triggerdev/core/ListProjects/ListProjects');
        const CreateBatchTrigger = require('../../src/appmixer/triggerdev/core/CreateBatchTrigger/CreateBatchTrigger');
        const ListDeployments = require('../../src/appmixer/triggerdev/core/ListDeployments/ListDeployments');
        const GetDeployment = require('../../src/appmixer/triggerdev/core/GetDeployment/GetDeployment');
        const ListEnvironments = require('../../src/appmixer/triggerdev/core/ListEnvironments/ListEnvironments');

        assert(ListRuns, 'ListRuns component should exist');
        assert(GetRun, 'GetRun component should exist');
        assert(CancelRun, 'CancelRun component should exist');
        assert(ReplayRun, 'ReplayRun component should exist');
        assert(ListTasks, 'ListTasks component should exist');
        assert(ListProjects, 'ListProjects component should exist');
        assert(CreateBatchTrigger, 'CreateBatchTrigger component should exist');
        assert(ListDeployments, 'ListDeployments component should exist');
        assert(GetDeployment, 'GetDeployment component should exist');
        assert(ListEnvironments, 'ListEnvironments component should exist');

        // Verify each component has receive method
        assert.strictEqual(typeof ListRuns.receive, 'function', 'ListRuns should have receive method');
        assert.strictEqual(typeof GetRun.receive, 'function', 'GetRun should have receive method');
        assert.strictEqual(typeof CancelRun.receive, 'function', 'CancelRun should have receive method');
        assert.strictEqual(typeof ReplayRun.receive, 'function', 'ReplayRun should have receive method');
        assert.strictEqual(typeof ListTasks.receive, 'function', 'ListTasks should have receive method');
        assert.strictEqual(typeof ListProjects.receive, 'function', 'ListProjects should have receive method');
        assert.strictEqual(typeof CreateBatchTrigger.receive, 'function', 'CreateBatchTrigger should have receive method');
        assert.strictEqual(typeof ListDeployments.receive, 'function', 'ListDeployments should have receive method');
        assert.strictEqual(typeof GetDeployment.receive, 'function', 'GetDeployment should have receive method');
        assert.strictEqual(typeof ListEnvironments.receive, 'function', 'ListEnvironments should have receive method');
    });
});
