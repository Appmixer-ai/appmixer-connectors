const path = require('path');
const { TestContext } = require('../helper');
const assert = require('assert');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

describe('replicate.core.CreatePrediction', () => {

    let context;

    beforeEach(() => {
        context = new TestContext({
            componentPath: 'src/appmixer/replicate/core/CreatePrediction',
            apiKey: process.env.REPLICATE_ACCESS_TOKEN
        });
    });

    it('should create a prediction with object input', async () => {
        const output = await context.test({
            input: {
                version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf', // GFPGAN face restoration
                input: {
                    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
                }
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.id === 'string', 'Should have prediction ID');
        assert(typeof output.status === 'string', 'Should have status');
        assert(typeof output.version === 'string', 'Should have version');
        
        // Store the prediction ID for other tests
        global.testPredictionId = output.id;
    });

    it('should create a prediction with JSON string input', async () => {
        const inputData = {
            img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Einstein_1921_by_F_Schmutzer_-_restoration.jpg/256px-Einstein_1921_by_F_Schmutzer_-_restoration.jpg'
        };

        const output = await context.test({
            input: {
                version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
                input: JSON.stringify(inputData)
            }
        });

        assert(output, 'Output should exist');
        assert(typeof output.id === 'string', 'Should have prediction ID');
        assert(typeof output.status === 'string', 'Should have status');
        assert(typeof output.version === 'string', 'Should have version');
    });

    it('should fail without version', async () => {
        try {
            await context.test({
                input: {
                    input: { prompt: 'test' }
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Version is required'), 'Should require version');
        }
    });

    it('should fail with invalid JSON input', async () => {
        try {
            await context.test({
                input: {
                    version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
                    input: 'invalid json {'
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Invalid input JSON format'), 'Should reject invalid JSON');
        }
    });

    it('should fail with null input', async () => {
        try {
            await context.test({
                input: {
                    version: 'db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
                    input: null
                }
            });
            assert.fail('Should have thrown an error');
        } catch (error) {
            assert(error.message.includes('Input must be a valid object'), 'Should require valid input object');
        }
    });
});
