const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('GetTask Component', function() {
    let context;
    let GetTask;

    this.timeout(30000);

    before(function() {
        if (
            !process.env.GOOGLE_TASKS_ACCESS_TOKEN ||
            !process.env.GOOGLE_TASKS_TASKLIST_ID ||
            !process.env.GOOGLE_TASKS_TASK_ID
        ) {
            console.log('Skipping test - required env vars not set');
            this.skip();
        }

        GetTask = require(
            path.join(__dirname, '../../src/appmixer/googleTasks/core/GetTask/GetTask.js')
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

    it('should get a task by id from a tasklist', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            task: process.env.GOOGLE_TASKS_TASK_ID
        };

        const result = await GetTask.receive(context);

        console.log('GetTask result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(
            result.data && result.data.id === process.env.GOOGLE_TASKS_TASK_ID,
            'Expected result.data.id to match task ID'
        );
        assert.strictEqual(result.port, 'out');
    });

    it('should throw CancelError if tasklist or task is missing', async function() {
        context.messages.in.content = {};

        try {
            await GetTask.receive(context);
            throw new Error('Expected CancelError');
        } catch (err) {
            assert(err instanceof context.CancelError, 'Expected CancelError to be thrown');
        }
    });
});
