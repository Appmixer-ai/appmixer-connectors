const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ListTasks Component', function() {
    let context;
    let ListTasks;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN || !process.env.GOOGLE_TASKS_TASKLIST_ID) {
            console.log('Skipping test - required env vars not set');
            this.skip();
        }

        ListTasks = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/ListTasks/ListTasks.js'));

        context = {
            auth: {
                accessToken: process.env.GOOGLE_TASKS_ACCESS_TOKEN
            },
            messages: {
                in: {
                    content: {}
                }
            },
            properties: {},
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

    it('should list all tasks in a tasklist', async function() {
        context.messages.in.content = {
            tasklist: process.env.GOOGLE_TASKS_TASKLIST_ID
        };

        const result = await ListTasks.receive(context);

        console.log('ListTasks result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data && Array.isArray(result.data), 'Expected result.data to be an array');
        assert.strictEqual(result.port, 'out');
    });
});
