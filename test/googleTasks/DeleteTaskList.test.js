const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('DeleteTaskList Component', function() {
    let context;
    let DeleteTaskList;
    let CreateTaskList;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN) {
            console.log('Skipping test - required env vars not set');
            this.skip();
        }

        DeleteTaskList = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/DeleteTaskList/DeleteTaskList.js'));
        CreateTaskList = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/CreateTaskList/CreateTaskList.js'));

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

    it('should delete a tasklist', async function() {
        // First create a task list to delete
        context.messages.in.content = {
            title: `Test TaskList for Deletion ${Date.now()}`
        };

        const createResult = await CreateTaskList.receive(context);
        const taskListId = createResult.data.id;

        // Now delete the created task list
        context.messages.in.content = {
            tasklist: taskListId
        };

        const result = await DeleteTaskList.receive(context);

        console.log('DeleteTaskList result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert.strictEqual(result.port, 'out');
        assert.strictEqual(result.data.success, true);
    });

    it('should throw CancelError if tasklist is missing', async function() {
        context.messages.in.content = {};

        try {
            await DeleteTaskList.receive(context);
            throw new Error('Expected CancelError');
        } catch (err) {
            assert(err instanceof context.CancelError, 'Expected CancelError to be thrown');
        }
    });
});
