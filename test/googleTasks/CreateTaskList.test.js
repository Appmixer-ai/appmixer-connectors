const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('CreateTaskList Component', function() {
    let context;
    let CreateTaskList;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN) {
            console.log('Skipping test - GOOGLE_TASKS_ACCESS_TOKEN not set');
            this.skip();
        }

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

    it('should create a new task list with a title', async function() {
        context.messages.in.content = {
            title: 'New Task List ' + Date.now()
        };

        const result = await CreateTaskList.receive(context);

        console.log('CreateTaskList result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data.id && typeof result.data.id === 'string', 'Expected task list ID to be a string');
        assert(result.data.title.includes('New Task List'), 'Expected title to include input');
        assert.strictEqual(result.port, 'out');
    });

    it('should throw CancelError if title is missing', async function() {
        context.messages.in.content = {};

        try {
            await CreateTaskList.receive(context);
            throw new Error('Expected CancelError');
        } catch (err) {
            assert(err instanceof context.CancelError, 'Expected error to be CancelError');
            assert(err.message.includes('title'), 'Expected error message to mention title');
        }
    });
});
