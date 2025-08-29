const assert = require('assert');
const sinon = require('sinon');
const path = require('path');
const testUtils = require('../../utils.js');

describe('utils-tasks-jobs', () => {

    let context;
    let handler;
    let triggerWebhooksStub;
    let taskFindSpy;
    let setMockTasks;
    let getSavedModels;

    beforeEach(async () => {
        // Reset the context
        context = {
            ...testUtils.createMockContext(),
            scheduleJob: sinon.stub()
        };

        // Provide Promise utils used by the job
        // Originally context.utils.P was set to Bluebird's Promise, but for testing we can use a simple implementation
        context.utils.P = {
            mapArray: async (arr, fn) => Promise.all(arr.map(fn))
        };

        // Stub the utils module used by jobs.js to avoid network and instance checks
        const utilsPath = path.resolve(__dirname, '../../../src/appmixer/utils/tasks/utils.js');
        triggerWebhooksStub = sinon.stub().callsFake(async () => [true]);
        const triggerWebhookStub = sinon.stub().resolves(true);
        require.cache[require.resolve(utilsPath)] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({
                triggerWebhooks: triggerWebhooksStub,
                triggerWebhook: triggerWebhookStub
            })
        };

        // Stub TaskModel to control records and capture saves
        const taskModelPath = path.resolve(__dirname, '../../../src/appmixer/utils/tasks/TaskModel.js');
        let records = [];
        let savedModels = [];
        class FakeTask {
            constructor(data) { Object.assign(this, data); }
            getId() { return this.taskId; }
            setStatus(status) { this.status = status; }
            async save() { savedModels.push(this); return this; }
            static get STATUS_DUE() { return 'due'; }
            static async find(query) { return records.map(r => new FakeTask(r)); }
        }
        taskFindSpy = sinon.spy(FakeTask, 'find');
        setMockTasks = (arr) => { records = arr; };
        getSavedModels = () => savedModels;
        require.cache[require.resolve(taskModelPath)] = {
            id: taskModelPath,
            filename: taskModelPath,
            loaded: true,
            exports: (/* context */) => FakeTask
        };

        // Stub WebhookModel minimally to satisfy second scheduled job registration
        const webhookModelPath = path.resolve(__dirname, '../../../src/appmixer/utils/tasks/WebhookModel.js');
        class FakeWebhook { static get STATUS_FAIL() { return 'fail'; } static async find() { return []; } }
        require.cache[require.resolve(webhookModelPath)] = {
            id: webhookModelPath,
            filename: webhookModelPath,
            loaded: true,
            exports: (/* context */) => FakeWebhook
        };

        // Register the jobs the same way Appmixer does.
        const jobsPath = path.resolve(__dirname, '../../../src/appmixer/utils/tasks/jobs.js');
        delete require.cache[require.resolve(jobsPath)];
        const jobs = require(jobsPath);
        await jobs(context);
        // Find the correct scheduled job handler by job name pattern
        const jobNamePattern = /due-tasks/;
        const matchingCall = context.scheduleJob.getCalls().find(call => {
            const nameArg = call.args[0];
            return jobNamePattern.test(nameArg);
        });
        handler = matchingCall ? matchingCall.args[2] : undefined;
    });

    it('should find and process due tasks', async () => {
        const dueTasks = [
            { taskId: 'task1', status: 'pending', decisionBy: new Date(Date.now() - 1000) },
            { taskId: 'task2', status: 'pending', decisionBy: new Date(Date.now() - 500) }
        ];
        setMockTasks(dueTasks);
        await handler();

        // Verify Task.find called with correct selector
        assert(taskFindSpy.calledOnce);
        const queryArg = taskFindSpy.getCall(0).args[0];
        assert.equal(queryArg.status, 'pending');
        assert(queryArg.decisionBy.$lt instanceof Date);

        // The job should set tasks to due and save them
        const saved = getSavedModels();
        assert.equal(saved.length, 2);
        assert(saved.every(m => m.status === 'due'));

        // Webhooks should be triggered once per task
        assert.equal(triggerWebhooksStub.callCount, 2);
        const triggerArgs = triggerWebhooksStub.getCalls().map(c => c.args[0]);
        assert(triggerArgs.some(arg => arg.getId() === 'task1'), 'Task with ID task1 should be processed');
        assert(triggerArgs.some(arg => arg.getId() === 'task2'), 'Task with ID task2 should be processed');
    });

    it('should handle no due tasks gracefully', async () => {
        setMockTasks([]);
        await handler();

        // No saves, no webhook triggers
        const saved = getSavedModels();
        assert.equal(saved.length, 0);
        assert.equal(triggerWebhooksStub.callCount, 0);
    });

});
