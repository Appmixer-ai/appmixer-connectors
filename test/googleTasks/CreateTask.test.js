const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateTask Component', function() {
    let context;
    let CreateTask;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN || !process.env.GOOGLE_TASKS_TASKLIST_ID) {
            console.log('Skipping tests - GOOGLE_TASKS_ACCESS_TOKEN or TASKLIST ID not set');
            this.skip();
        }

        CreateTask = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/CreateTask/CreateTask.js'));

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

    it('should create a task with title only', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            title: 'Test Task ' + Date.now()
        };

        const result = await CreateTask.receive(context);

        console.log('CreateTask result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data && typeof result.data === 'object', 'Expected result.data to be an object');
        assert(result.data.id && typeof result.data.id === 'string', 'Expected result.data.id to be a string');
        assert.strictEqual(result.port, 'out');
    });

    it('should create a task with all fields', async function() {
        const timestamp = Date.now();

        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID,
            title: 'Complete Report',
            notes: 'Finish writing by ' + timestamp,
            due: new Date(Date.now() + 86400000).toISOString(), // tomorrow
            status: 'needsAction'
        };

        const result = await CreateTask.receive(context);

        console.log('CreateTask full result:', JSON.stringify(result, null, 2));

        assert(result.data.title.includes('Complete Report'));
        assert(result.data.status === 'needsAction');
    });
});
