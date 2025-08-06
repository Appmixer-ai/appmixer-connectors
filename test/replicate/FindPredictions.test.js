const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');

describe('replicate.core.FindPredictions', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindPredictions',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should find all predictions', async () => {
        const output = await context.test({
            input: {
                outputType: 'array'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.result === 'object', 'Result should be an object');
        assert(Array.isArray(output.result), 'Result should be an array');
        assert(typeof output.count === 'number', 'Count should be a number');
        
        if (output.result.length > 0) {
            const prediction = output.result[0];
            assert(typeof prediction.id === 'string', 'Prediction should have id');
            assert(typeof prediction.status === 'string', 'Prediction should have status');
            assert(typeof prediction.created_at === 'string', 'Prediction should have created_at');
        }
    });

    it('should filter predictions by status', async () => {
        const output = await context.test({
            input: {
                status: 'succeeded',
                outputType: 'array'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.result === 'object', 'Result should be an object');
        assert(Array.isArray(output.result), 'Result should be an array');
        assert(typeof output.count === 'number', 'Count should be a number');
        
        // Check that all returned predictions have the expected status
        if (output.result.length > 0) {
            output.result.forEach(prediction => {
                assert(prediction.status === 'succeeded', 'All predictions should have succeeded status');
            });
        }
    });

    it('should return first prediction only', async () => {
        const output = await context.test({
            input: {
                outputType: 'first'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.id === 'string', 'Prediction should have id');
        assert(typeof output.status === 'string', 'Prediction should have status');
        assert(typeof output.index === 'number', 'Should have index');
        assert(typeof output.count === 'number', 'Should have count');
    });

    it('should generate output port options for array', async () => {
        context.setProperties({ generateOutputPortOptions: true });
        
        const output = await context.test({
            input: {
                outputType: 'array'
            }
        });

        assert(Array.isArray(output), 'Output should be an array of options');
        assert(output.length > 0, 'Should have output options');
        
        const resultOption = output.find(option => option.value === 'result');
        assert(resultOption, 'Should have result option');
        assert(resultOption.schema.type === 'array', 'Result should be array type');
    });

    it('should generate output port options for object', async () => {
        context.setProperties({ generateOutputPortOptions: true });
        
        const output = await context.test({
            input: {
                outputType: 'object'
            }
        });

        assert(Array.isArray(output), 'Output should be an array of options');
        assert(output.length > 0, 'Should have output options');
        
        const idOption = output.find(option => option.value === 'id');
        assert(idOption, 'Should have id option');
        assert(idOption.schema.type === 'string', 'ID should be string type');
        
        const statusOption = output.find(option => option.value === 'status');
        assert(statusOption, 'Should have status option');
        assert(statusOption.schema.type === 'string', 'Status should be string type');
    });
});
