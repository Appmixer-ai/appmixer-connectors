const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const ListProjects = require('../../src/appmixer/triggerdev/core/ListProjects/ListProjects');
const httpRequest = require('./httpRequest');

// Mock context
const createMockContext = (auth, messages = {}) => {
    return {
        auth,
        messages,
        properties: {},
        httpRequest,
        sendJson: (data, port) => {
            return { data, port };
        },
        CancelError: Error,
        config: {},
        flowDescriptor: {},
        componentId: 'test-component'
    };
};

describe('ListProjects Component', () => {

    const apiKey = process.env.TRIGGERDEV_API_KEY;
    const baseUrl = process.env.TRIGGERDEV_BASE_URL || 'https://cloud.trigger.dev';

    if (!apiKey) {
        console.log('Skipping tests - TRIGGERDEV_API_KEY not set');
        return;
    }

    it('should list projects with array output type', async () => {

        const context = createMockContext({
            apiKey: apiKey,
            baseUrl: baseUrl
        }, {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        });

        const result = await ListProjects.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert(result.data.result, 'Result should have projects array');
        assert(Array.isArray(result.data.result), 'Projects should be an array');
        assert.strictEqual(typeof result.data.count, 'number', 'Count should be a number');

        if (result.data.result.length > 0) {
            const project = result.data.result[0];
            assert(project.id, 'Project should have id');
            assert(project.name, 'Project should have name');
        }

        console.log('✅ Listed projects:', result.data.count);
    });

    it('should handle generateOutputPortOptions', async () => {

        const context = createMockContext({
            apiKey: apiKey,
            baseUrl: baseUrl
        }, {
            in: {
                content: {
                    outputType: 'array'
                }
            }
        });

        context.properties.generateOutputPortOptions = true;

        const result = await ListProjects.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(Array.isArray(result.data), 'Result should be an array of options');

        const countOption = result.data.find(option => option.value === 'count');
        assert(countOption, 'Should have count option');
        assert.strictEqual(countOption.label, 'Items Count', 'Count option should have correct label');

        const resultOption = result.data.find(option => option.value === 'result');
        assert(resultOption, 'Should have result option');
        assert.strictEqual(resultOption.label, 'Projects', 'Result option should have correct label');
    });
});
