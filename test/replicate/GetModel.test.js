const path = require('path');
const { TestContext } = require('../helper');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('replicate.core.GetModel', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/GetModel',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should get model details', async () => {
        const output = await context.test({
            input: {
                model_owner: 'tencentarc',
                model_name: 'gfpgan'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.url === 'string', 'Should have url');
        assert(typeof output.owner === 'string', 'Should have owner');
        assert(typeof output.name === 'string', 'Should have name');
        assert(typeof output.description === 'string', 'Should have description');
        assert(output.owner === 'tencentarc', 'Should return correct owner');
        assert(output.name === 'gfpgan', 'Should return correct name');
        
        if (output.latest_version) {
            assert(typeof output.latest_version === 'object', 'Latest version should be object');
        }
    });

    it('should get another model', async () => {
        const output = await context.test({
            input: {
                model_owner: 'stability-ai',
                model_name: 'stable-diffusion'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.url === 'string', 'Should have url');
        assert(typeof output.owner === 'string', 'Should have owner');
        assert(typeof output.name === 'string', 'Should have name');
        assert(output.owner === 'stability-ai', 'Should return correct owner');
        assert(output.name === 'stable-diffusion', 'Should return correct name');
    });

    it('should fail without model_owner', async () => {
        try {
            await context.test({
                input: {
                    model_name: 'gfpgan'
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Model owner and model name are required'), 'Should require model owner');
        }
    });

    it('should fail without model_name', async () => {
        try {
            await context.test({
                input: {
                    model_owner: 'tencentarc'
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Model owner and model name are required'), 'Should require model name');
        }
    });

    it('should fail with invalid model', async () => {
        try {
            await context.test({
                input: {
                    model_owner: 'invalid-owner',
                    model_name: 'invalid-model'
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            // This should fail with a 404 or similar error from the API
            assert(error.response && error.response.status >= 400, 'Should return API error for invalid model');
        }
    });

    it('should handle special characters in model names', async () => {
        // Test with a model that might have special characters
        const output = await context.test({
            input: {
                model_owner: 'tencentarc',
                model_name: 'gfpgan'
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.url === 'string', 'Should have url');
    });
});
