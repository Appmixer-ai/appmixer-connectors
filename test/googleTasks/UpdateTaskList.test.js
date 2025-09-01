const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('UpdateTaskList Component', function() {
    let context;
    let UpdateTaskList;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN || !process.env.GOOGLE_TASKS_TASKLIST_ID) {
            console.log('Skipping tests - required env vars not set');
            this.skip();
        }

        UpdateTaskList = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/UpdateTaskList/UpdateTaskList.js'));

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

    it('should update a tasklist title', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            title: 'Updated TaskList Title ' + Date.now()
        };

        const result = await UpdateTaskList.receive(context);

        console.log('UpdateTaskList result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
        assert(result.data.id === process.env.GOOGLE_TASKS_TASKLIST_ID, 'Expected result.data.id to match tasklist ID');
        assert(result.data.title.includes('Updated TaskList Title'), 'Expected result.data.title to be updated');
        assert.strictEqual(result.port, 'out');
    });
});
