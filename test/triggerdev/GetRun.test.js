const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import the component
const GetRun = require('../../src/appmixer/triggerdev/core/GetRun/GetRun');
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
        CancelError: Error
    };
};

describe('GetRun Component', () => {

    const apiKey = process.env.TRIGGERDEV_API_KEY;
    const baseUrl = process.env.TRIGGERDEV_BASE_URL || 'https://cloud.trigger.dev';
    const testRunId = process.env.TRIGGERDEV_TEST_RUN_ID;

    if (!apiKey) {
        console.log('Skipping tests - TRIGGERDEV_API_KEY not set');
        return;
    }

    it('should throw error when runId is missing', async () => {

        const context = createMockContext({
            apiKey: apiKey,
            baseUrl: baseUrl
        }, {
            in: {
                content: {}
            }
        });

        try {
            await GetRun.receive(context);
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Run ID is required'), 'Should throw error about missing runId');
        }
    });

    it('should get run by ID if test run ID is provided', async () => {

        if (!testRunId) {
            console.log('Skipping test - TRIGGERDEV_TEST_RUN_ID not set');
            return;
        }

        const context = createMockContext({
            apiKey: apiKey,
            baseUrl: baseUrl
        }, {
            in: {
                content: {
                    runId: testRunId
                }
            }
        });

        const result = await GetRun.receive(context);

        assert(result, 'Result should be defined');
        assert.strictEqual(result.port, 'out', 'Should send to out port');
        assert(result.data, 'Result should have data');
        assert.strictEqual(result.data.id, testRunId, 'Run ID should match');

        console.log('✅ Retrieved run:', result.data.id);
    });
});
