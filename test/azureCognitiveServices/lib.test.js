const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array of visual features as is', () => {
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(['Categories', 'Tags', 'Description'], 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, ['Categories', 'Tags', 'Description']);
        });

        it('should convert comma-separated string to array', () => {
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput('Categories,Tags,Description', 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, ['Categories', 'Tags', 'Description']);
        });

        it('should handle comma-separated string with spaces', () => {
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput('Categories, Tags , Description', 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, ['Categories', 'Tags', 'Description']);
        });

        it('should filter out empty strings from comma-separated input', () => {
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput('Categories,,Tags,', 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, ['Categories', 'Tags']);
        });

        it('should throw if array exceeds maxItems', () => {
            const largeArray = Array.from({ length: 11 }, (_, i) => `Feature${i + 1}`);
            assert.throws(() => {
                require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(largeArray, 10, context, 'visualFeatures');
            }, context.CancelError);
        });

        it('should throw if comma-separated string exceeds maxItems', () => {
            const largeString = Array.from({ length: 11 }, (_, i) => `Feature${i + 1}`).join(',');
            assert.throws(() => {
                require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(largeString, 10, context, 'visualFeatures');
            }, context.CancelError);
        });

        it('should throw if input is not array or string', () => {
            assert.throws(() => {
                require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(123, 10, context, 'visualFeatures');
            }, context.CancelError);
        });

        it('should not throw when maxItems is Infinity', () => {
            const largeArray = Array.from({ length: 50 }, (_, i) => `Feature${i + 1}`);
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(largeArray, Infinity, context, 'visualFeatures');
            assert.deepStrictEqual(result, largeArray);
        });

        it('should handle Azure Cognitive Services specific features', () => {
            const azureFeatures = ['Categories', 'Tags', 'Description', 'Faces', 'ImageType', 'Color', 'Adult', 'Objects', 'Brands'];
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(azureFeatures, 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, azureFeatures);
        });

        it('should handle comma-separated Azure features string', () => {
            const azureFeaturesString = 'Categories,Tags,Description,Faces,ImageType,Color,Adult,Objects,Brands';
            const expectedArray = ['Categories', 'Tags', 'Description', 'Faces', 'ImageType', 'Color', 'Adult', 'Objects', 'Brands'];
            const result = require('../../src/appmixer/azureCognitiveServices/lib').normalizeMultiselectInput(azureFeaturesString, 10, context, 'visualFeatures');
            assert.deepStrictEqual(result, expectedArray);
        });
    });
});
