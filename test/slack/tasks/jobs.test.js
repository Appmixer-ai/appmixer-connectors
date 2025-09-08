const assert = require('assert');
const sinon = require('sinon');
const path = require('path');
const testUtils = require('../../utils.js');

/**
 * Tests for Slack jobs (src/appmixer/slack/jobs.js)
 * Verifies:
 *  - due-tasks job finds correct tasks, sets status to due, saves, and triggers webhooks
 *  - resubmit-failed-webhooks job finds failed webhooks and re-triggers them
 */

describe('slack-tasks-jobs', () => {

    let context;
    let dueHandler;
    let resubmitHandler;
    let triggerWebhooksStub;
    let triggerWebhookStub;
    let taskFindSpy;
    let webhookFindSpy;
    let setMockTasks;
    let setMockWebhooks;
    let getSavedTasks;
    // eslint-disable-next-line max-len, one-var
    let utilsPath, taskModelPath, webhookModelPath, jobsPath, jobsUtilsRequirePath, jobsTaskRequirePath, jobsWebhookRequirePath;

    beforeEach(async () => {
        context = {
            ...testUtils.createMockContext(),
            scheduleJob: sinon.stub()
        };

        // Provide Promise utils used by the job
        context.utils.P = {
            mapArray: async (arr, fn) => Promise.all(arr.map(fn))
        };

        // Stub the utils module used by slack/jobs.js
        utilsPath = path.resolve(__dirname, '../../../src/appmixer/slack/tasks/utils.js');
        triggerWebhooksStub = sinon.stub().callsFake(async () => [true]);
        triggerWebhookStub = sinon.stub().resolves(true);
        require.cache[require.resolve(utilsPath)] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({
                triggerWebhooks: triggerWebhooksStub,
                triggerWebhook: triggerWebhookStub
            })
        };

        // Stub SlackTaskModel
        taskModelPath = path.resolve(__dirname, '../../../src/appmixer/slack/tasks/SlackTaskModel.js');
        let taskRecords = [];
        let savedTasks = [];
        class FakeTask {
            constructor(data) { Object.assign(this, data); }
            getId() { return this.taskId; }
            setStatus(status) { this.status = status; }
            async save() { savedTasks.push(this); return this; }
            static get STATUS_DUE() { return 'due'; }
            static async find(query) { return taskRecords.map(r => new FakeTask(r)); }
        }
        taskFindSpy = sinon.spy(FakeTask, 'find');
        setMockTasks = (arr) => { taskRecords = arr; savedTasks = []; };
        getSavedTasks = () => savedTasks;
        require.cache[require.resolve(taskModelPath)] = {
            id: taskModelPath,
            filename: taskModelPath,
            loaded: true,
            exports: () => FakeTask
        };
        // Also provide a stub for the path slack/jobs.js uses ('./SlackTaskModel')
        const jobsDir = path.resolve(__dirname, '../../../src/appmixer/slack');
        jobsTaskRequirePath = path.join(jobsDir, 'SlackTaskModel.js');
        require.cache[jobsTaskRequirePath] = {
            id: jobsTaskRequirePath,
            filename: jobsTaskRequirePath,
            loaded: true,
            exports: () => FakeTask
        };

        // Stub SlackWebhookModel
        webhookModelPath = path.resolve(__dirname, '../../../src/appmixer/slack/tasks/SlackWebhookModel.js');
        let webhookRecords = [];
        class FakeWebhook { static get STATUS_FAIL() { return 'fail'; } static async find(query) { return webhookRecords; } }
        webhookFindSpy = sinon.spy(FakeWebhook, 'find');
        setMockWebhooks = (arr) => { webhookRecords = arr; };
        require.cache[require.resolve(webhookModelPath)] = {
            id: webhookModelPath,
            filename: webhookModelPath,
            loaded: true,
            exports: () => FakeWebhook
        };
        jobsWebhookRequirePath = path.join(jobsDir, 'SlackWebhookModel.js');
        require.cache[jobsWebhookRequirePath] = {
            id: jobsWebhookRequirePath,
            filename: jobsWebhookRequirePath,
            loaded: true,
            exports: () => FakeWebhook
        };

        // Provide './utils' path expected by slack/jobs.js
        jobsUtilsRequirePath = path.join(jobsDir, 'utils.js');
        require.cache[jobsUtilsRequirePath] = {
            id: jobsUtilsRequirePath,
            filename: jobsUtilsRequirePath,
            loaded: true,
            exports: () => ({
                triggerWebhooks: triggerWebhooksStub,
                triggerWebhook: triggerWebhookStub
            })
        };

        // Register the jobs
        jobsPath = path.resolve(__dirname, '../../../src/appmixer/slack/jobs.js');
        delete require.cache[require.resolve(jobsPath)];
        const jobs = require(jobsPath);
        await jobs(context);
        // First scheduled handler is due-tasks, second is resubmit-failed-webhooks
        dueHandler = context.scheduleJob.getCall(0).args[2];
        resubmitHandler = context.scheduleJob.getCall(1).args[2];
    });

    afterEach(() => {
        sinon.restore();
        // eslint-disable-next-line max-len
        [utilsPath, jobsUtilsRequirePath, taskModelPath, jobsTaskRequirePath, webhookModelPath, jobsWebhookRequirePath, jobsPath].forEach(p => {
            if (p && require.cache[p]) delete require.cache[p];
        });
    });

    it('should find and process due tasks', async () => {
        const dueTasks = [
            { taskId: 't1', status: 'pending', decisionBy: new Date(Date.now() - 1000) },
            { taskId: 't2', status: 'pending', decisionBy: new Date(Date.now() - 500) }
        ];
        setMockTasks(dueTasks);

        await dueHandler();

        // Verify Task.find query
        assert(taskFindSpy.calledOnce);
        const queryArg = taskFindSpy.getCall(0).args[0];
        assert.equal(queryArg.status, 'pending');
        assert(queryArg.decisionBy.$lt instanceof Date);

        // Saved tasks should be marked due
        const saved = getSavedTasks();
        assert.equal(saved.length, 2);
        assert(saved.every(t => t.status === 'due'));

        // Webhooks should be triggered once per task
        assert.equal(triggerWebhooksStub.callCount, 2);
    });

    it('should handle no due tasks gracefully', async () => {
        setMockTasks([]);
        await dueHandler();
        const saved = getSavedTasks();
        assert.equal(saved.length, 0);
        assert.equal(triggerWebhooksStub.callCount, 0);
    });

    it('should resubmit failed webhooks', async () => {
        const failedWebhooks = [{ webhookId: 'w1' }, { webhookId: 'w2' }];
        setMockWebhooks(failedWebhooks);

        await resubmitHandler();

        assert(webhookFindSpy.calledOnce);
        const queryArg = webhookFindSpy.getCall(0).args[0];
        // Should look for failed status
        assert.equal(queryArg.status, 'fail');

        // Each failed webhook should be retriggered
        assert.equal(triggerWebhookStub.callCount, failedWebhooks.length);
    });
});
