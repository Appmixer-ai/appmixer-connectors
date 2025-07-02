const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateTask Component', function() {
    let context;
    let UpdateTask;

    this.timeout(30000);

    before(function() {
        if (
            !process.env.GOOGLE_TASKS_ACCESS_TOKEN ||
            !process.env.GOOGLE_TASKS_TASKLIST_ID ||
            !process.env.GOOGLE_TASKS_TASK_ID
        ) {
            console.log('Skipping tests - required env vars not set');
            this.skip();
        }

        UpdateTask = require(
            path.join(__dirname, '../../src/appmixer/googleTasks/core/UpdateTask/UpdateTask.js')
        );

        context = {
            auth: {
                accessToken: process.env.GOOGLE_TASKS_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            sendJson: function(data, port) {
                return { data, port };
            },
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };
    });

    it('should update a task title', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            task: process.env.GOOGLE_TASKS_TASK_ID,
            title: 'Updated Task Title ' + Date.now()
        };

        const result = await UpdateTask.receive(context);

        console.log('UpdateTask result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
        assert(result.data.id === process.env.GOOGLE_TASKS_TASK_ID, 'Expected result.data.id to match task ID');
        assert(result.data.title.includes('Updated Task Title'), 'Expected result.data.title to be updated');
        assert.strictEqual(result.port, 'out');
    });

    it('should update a task with all fields', async function() {
        const timestamp = Date.now();

        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            task: process.env.GOOGLE_TASKS_TASK_ID,
            title: 'Updated Full Task',
            notes: 'Updated notes ' + timestamp,
            due: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            status: 'needsAction'
        };

        const result = await UpdateTask.receive(context);

        console.log('UpdateTask full result:', JSON.stringify(result, null, 2));

        assert(result.data.title.includes('Updated Full Task'));
        assert(result.data.status === 'needsAction');
        assert(result.data.notes.includes('Updated notes'));
    });
});
