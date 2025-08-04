const path = require('path');
const { TestContext } = require('../helper');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('replicate.core.FindModels', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/FindModels',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should find models without search', async () => {
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
            const model = output.result[0];
            assert(typeof model.url === 'string', 'Model should have url');
            assert(typeof model.owner === 'string', 'Model should have owner');
            assert(typeof model.name === 'string', 'Model should have name');
        }
    });

    it('should find models with search', async () => {
        const output = await context.test({
            input: {
                search: 'stable-diffusion',
                outputType: 'array'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.result === 'object', 'Result should be an object');
        assert(Array.isArray(output.result), 'Result should be an array');
        assert(typeof output.count === 'number', 'Count should be a number');
    });

    it('should return first model only', async () => {
        const output = await context.test({
            input: {
                outputType: 'first'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.url === 'string', 'Model should have url');
        assert(typeof output.owner === 'string', 'Model should have owner');
        assert(typeof output.name === 'string', 'Model should have name');
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
        
        const urlOption = output.find(option => option.value === 'url');
        assert(urlOption, 'Should have url option');
        assert(urlOption.schema.type === 'string', 'URL should be string type');
    });
});
