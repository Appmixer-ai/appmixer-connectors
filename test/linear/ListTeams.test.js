const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const ListTeams = require('../../src/appmixer/linear/core/ListTeams/ListTeams');

// Mock context
const createMockContext = (auth, messages = {}) => {
    return {
        auth,
        messages,
        properties: {},
        httpRequest: async (options) => {
            const response = await axios({
                method: options.method || 'GET',
                url: options.url,
                headers: options.headers,
                data: options.data
            });

            return {
                data: response.data,
                status: response.status,
                headers: response.headers
            };
        },
        sendJson: (data, port) => {
            return { data, port };
        },
        CancelError: Error
    };
};

describe('ListTeams Component', () => {

    const accessToken = process.env.LINEAR_ACCESS_TOKEN;

    if (!accessToken) {
        console.log('Skipping tests - LINEAR_ACCESS_TOKEN not set');
        return;
    }

    it('should list teams with array output type', async () => {

        const context = createMockContext({
            accessToken: accessToken
        }, {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        });

        const result = await ListTeams.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert(result.data.result, 'Result should have teams array');
        assert(Array.isArray(result.data.result), 'Teams should be an array');
        assert.strictEqual(typeof result.data.count, 'number', 'Count should be a number');

        if (result.data.result.length > 0) {
            const team = result.data.result[0];
            assert(team.id, 'Team should have id');
            assert(team.name, 'Team should have name');
            assert(team.key, 'Team should have key');
            assert.strictEqual(typeof team.memberCount, 'number', 'Team should have memberCount');
        }

        console.log('✅ Listed teams:', result.data.count);
    });

    it('should default to array output type when not specified', async () => {

        const context = createMockContext({
            accessToken: accessToken
        }, {
            in: {
                content: {}
            }
        });

        const result = await ListTeams.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert(result.data.result, 'Result should have teams array');
        assert(Array.isArray(result.data.result), 'Teams should be an array');
    });

    it('should handle object output type', async () => {

        const context = createMockContext({
            accessToken: accessToken
        }, {
            in: {
                content: {
                    outputType: 'object'
                }
            }
        });

        const result = await ListTeams.receive(context);

        assert(result, 'Result should be defined');

        if (result.port === 'notFound') {
            console.log('No teams found for object output type test');
            return;
        }

        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert(result.data.id, 'Team should have id');
        assert(result.data.name, 'Team should have name');
        assert(result.data.key, 'Team should have key');
        assert.strictEqual(typeof result.data.index, 'number', 'Should have index');
        assert.strictEqual(typeof result.data.count, 'number', 'Should have count');
    });

    it('should handle first output type', async () => {

        const context = createMockContext({
            accessToken: accessToken
        }, {
            in: {
                content: {
                    outputType: 'first'
                }
            }
        });

        const result = await ListTeams.receive(context);

        assert(result, 'Result should be defined');

        if (result.port === 'notFound') {
            console.log('No teams found for first output type test');
            return;
        }

        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert(result.data.id, 'Team should have id');
        assert(result.data.name, 'Team should have name');
        assert(result.data.key, 'Team should have key');
        assert.strictEqual(result.data.index, 0, 'Should have index 0 for first item');
        assert.strictEqual(typeof result.data.count, 'number', 'Should have count');
    });

    it('should handle generateOutputPortOptions', async () => {

        const context = createMockContext({
            accessToken: accessToken
        }, {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        });

        context.properties.generateOutputPortOptions = true;

        const result = await ListTeams.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(Array.isArray(result.data), 'Result should be an array of options');

        const countOption = result.data.find(option => option.value === 'count');
        assert(countOption, 'Should have count option');
        assert.strictEqual(countOption.label, 'Items Count', 'Count option should have correct label');

        const resultOption = result.data.find(option => option.value === 'result');
        assert(resultOption, 'Should have result option');
        assert.strictEqual(resultOption.label, 'Teams', 'Result option should have correct label');
    });
});
