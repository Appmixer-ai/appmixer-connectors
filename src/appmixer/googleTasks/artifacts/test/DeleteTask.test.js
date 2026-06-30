const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteTask Component', function() {
    let context;
    let DeleteTask;

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

        DeleteTask = require(
            path.join(
                __dirname,
                '../../src/appmixer/googleTasks/core/DeleteTask/DeleteTask.js'
            )
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

    it('should delete a task from a tasklist', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            task: process.env.GOOGLE_TASKS_TASK_ID
        };

        const result = await DeleteTask.receive(context);

        console.log('DeleteTask result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data.success === true, 'Expected result to indicate success');
        assert.strictEqual(result.port, 'out');
    });

    it('should throw CancelError if tasklist or task is missing', async function() {
        context.messages.in.content = {};

        try {
            await DeleteTask.receive(context);
            throw new Error('Expected CancelError');
        } catch (err) {
            assert(err instanceof context.CancelError, 'Expected CancelError to be thrown');
        }
    });
});
