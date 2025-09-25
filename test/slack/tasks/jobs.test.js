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

describe('slack-due-tasks', () => {

    let context;
    let dueHandler;
    let resubmitHandler;
    let triggerWebhookStub;
    let taskFindSpy;
    let setMockTasks;
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
        triggerWebhookStub = sinon.stub().resolves(true);
        require.cache[require.resolve(utilsPath)] = {
            id: utilsPath,
            filename: utilsPath,
            loaded: true,
            exports: () => ({
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
            static get STATUS_ERROR() { return 'error'; }
            static get STATUS_PENDING() { return 'pending'; }
            static get collection() { return 'slack_tasks'; }
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

        // Provide './utils' path expected by slack/jobs.js
        jobsUtilsRequirePath = path.join(jobsDir, 'utils.js');
        require.cache[jobsUtilsRequirePath] = {
            id: jobsUtilsRequirePath,
            filename: jobsUtilsRequirePath,
            loaded: true,
            exports: () => ({
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
        assert.equal(triggerWebhookStub.callCount, 2);
    });

    it('should handle no due tasks gracefully', async () => {
        setMockTasks([]);
        await dueHandler();
        const saved = getSavedTasks();
        assert.equal(saved.length, 0);
        assert.equal(triggerWebhookStub.callCount, 0);
    });

    it('should resubmit failed webhooks', async () => {

        // Prepare two tasks in error state: one will succeed when retried, one will fail
        const errorTasks = [
            { taskId: 'e1', status: 'error' },
            { taskId: 'e2', status: 'error' }
        ];
        setMockTasks(errorTasks);

        // Configure triggerWebhook: succeed for first, fail for second
        triggerWebhookStub.onCall(0).resolves(true);
        triggerWebhookStub.onCall(1).rejects(new Error('webhook failed'));

        await resubmitHandler();

        // Verify Task.find called for error status
        assert(taskFindSpy.called);

        const saved = getSavedTasks();
        // First task should have been set to pending then saved, second should be reverted back to error and saved
        const sbyId = id => saved.find(t => t.taskId === id) || null;
        const firstSaved = sbyId('e1');
        const secondSaved = sbyId('e2');
        assert(firstSaved, 'first task was not saved');
        assert(secondSaved, 'second task was not saved');

        // First should be pending, second should be error
        assert.equal(firstSaved.status, 'pending');
        assert.equal(secondSaved.status, 'error');

        // triggerWebhook should be called twice
        assert.equal(triggerWebhookStub.callCount, 2);

    });

    it('should handle no failed webhooks gracefully', async () => {
        setMockTasks([]);
        await resubmitHandler();
        const saved = getSavedTasks();
        assert.equal(saved.length, 0);
        assert.equal(triggerWebhookStub.callCount, 0);
    });

    it('should remove tasks older than 60 days via deleteMany', async () => {
        // Arrange: create 10 tasks all on the same day
        const clock = sinon.useFakeTimers(new Date('2025-01-01T00:00:00Z').getTime());
        const tenTasks = Array.from({ length: 10 }).map((_, i) => ({
            taskId: `old-${i + 1}`,
            status: 'pending',
            createdAt: new Date(),
            decisionBy: new Date()
        }));
        setMockTasks(tenTasks);

        // Stub deleteMany to return the number of deleted tasks
        const coll = context.db.collection();
        coll.deleteMany.resolves({ deletedCount: tenTasks.length });

        // Act: jump ahead by 61 days to trigger cleanup of >60 days old tasks
        clock.tick(61 * 24 * 60 * 60 * 1000);
        await dueHandler();

        // Assert the correct collection and filter used
        assert(context.db.collection.calledWith('slack_tasks'));
        assert.equal(coll.deleteMany.callCount, 1);
        const filterArg = coll.deleteMany.getCall(0).args[0];
        assert(filterArg && filterArg.createdAt && filterArg.createdAt.$lt instanceof Date);
        const expectedCutoff = new Date(Date.now());
        expectedCutoff.setDate(expectedCutoff.getDate() - 60);
        assert.equal(filterArg.createdAt.$lt.getTime(), expectedCutoff.getTime());

        clock.restore();
    });
});
