const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('ListTaskLists Component', function() {
    let context;
    let ListTaskLists;

    this.timeout(30000);

    before(function() {
        if (!process.env.GOOGLE_TASKS_ACCESS_TOKEN) {
            console.log('Skipping test - required env vars not set');
            this.skip();
        }

        ListTaskLists = require(path.join(__dirname, '../../src/appmixer/googleTasks/core/ListTaskLists/ListTaskLists.js'));

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

    it('should list all tasklists', async function() {
        context.messages.in.content = {};

        const result = await ListTaskLists.receive(context);

        console.log('ListTaskLists result:', JSON.stringify(result, null, 2));

        assert(result && typeof result === 'object', 'Expected result to be an object');
        assert(result.data && Array.isArray(result.data), 'Expected result.data to be an array');
        assert.strictEqual(result.port, 'out');
    });
});
