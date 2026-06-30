const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const assert = require('assert');
const sinon = require('sinon');

describe('GetDataset Component', function() {
    let context;
    let GetDataset;

    this.timeout(30000);

    before(function() {
        // Skip all tests if the access token is not set
        if (!process.env.AXIOM_API_TOKEN) {
            console.log('Skipping tests - AXIOM_API_TOKEN not set');
            this.skip();
        }

        // Load the component
        GetDataset = require(path.join(__dirname, '../datasets/GetDataset/GetDataset.js'));

        // Mock context
        context = {
            auth: {
                apiToken: process.env.AXIOM_API_TOKEN
            },
            messages: {
                in: {}
            },
            properties: {},
            httpRequest: require('./httpRequest.js'),
            CancelError: class extends Error {
                constructor(message) {
                    super(message);
                    this.name = 'CancelError';
                }
            }
        };

        assert(context.auth.apiToken, 'AXIOM_API_TOKEN environment variable is required for tests');
    });

    it('should throw error when datasetId is missing', async function() {
        context.messages.in = {
            content: {
                // Missing datasetId
            }
        };

        try {
            await GetDataset.receive(context);
            assert.fail('Expected error for missing datasetId');
        } catch (error) {
            assert(error.message.includes('Dataset ID is required'), 'Expected error about dataset ID');
        }
    });

    it('should get dataset successfully with mocked data', async function() {
        const mockDataset = {
            id: 'test-dataset-id',
            name: 'Test Dataset',
            description: 'A test dataset',
            who: 'test@example.com',
            created: '2024-01-01T00:00:00Z'
        };

        // Mock httpRequest to return sample data
        const mockHttpRequest = sinon.stub().resolves({
            data: mockDataset
        });

        context.httpRequest = mockHttpRequest;

        let data;
        context.sendJson = function(output, port) {
            data = output;
            return { data: output, port };
        };

        context.messages.in = {
            content: {
                datasetId: 'test-dataset-id'
            }
        };

        await GetDataset.receive(context);

        assert(data, 'Expected data to be returned');
        assert.strictEqual(data.id, 'test-dataset-id', 'Expected correct dataset ID');
        assert.strictEqual(data.name, 'Test Dataset', 'Expected correct dataset name');
        assert(mockHttpRequest.calledOnce, 'Expected httpRequest to be called once');

        const callArgs = mockHttpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.method, 'GET', 'Expected GET method');
        assert(callArgs.url.includes('test-dataset-id'), 'Expected URL to contain dataset ID');
        assert(callArgs.headers.Authorization.includes('Bearer'), 'Expected Authorization header with Bearer token');
    });
});
