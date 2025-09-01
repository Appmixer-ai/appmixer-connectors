const assert = require('assert');

describe('lib.js', () => {

    describe('normalizeMultiselectInput', () => {

        const context = { CancelError: class CancelError extends Error {} };

        it('should return array of submission types as is', () => {
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(['online_quiz', 'online_upload', 'online_text_entry'], 10, context, 'submissionTypes');
            assert.deepStrictEqual(result, ['online_quiz', 'online_upload', 'online_text_entry']);
        });

        it('should convert comma-separated string to array', () => {
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput('online_quiz,online_upload,online_text_entry', 10, context, 'submissionTypes');
            assert.deepStrictEqual(result, ['online_quiz', 'online_upload', 'online_text_entry']);
        });

        it('should handle comma-separated string with spaces', () => {
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput('online_quiz, online_upload , online_text_entry', 10, context, 'submissionTypes');
            assert.deepStrictEqual(result, ['online_quiz', 'online_upload', 'online_text_entry']);
        });

        it('should filter out empty strings from comma-separated input', () => {
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput('online_quiz,,online_upload,', 10, context, 'submissionTypes');
            assert.deepStrictEqual(result, ['online_quiz', 'online_upload']);
        });

        it('should throw if array exceeds maxItems', () => {
            const largeArray = Array.from({ length: 11 }, (_, i) => `submission_type_${i + 1}`);
            assert.throws(() => {
                require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(largeArray, 10, context, 'submissionTypes');
            }, context.CancelError);
        });

        it('should throw if comma-separated string exceeds maxItems', () => {
            const largeString = Array.from({ length: 11 }, (_, i) => `submission_type_${i + 1}`).join(',');
            assert.throws(() => {
                require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(largeString, 10, context, 'submissionTypes');
            }, context.CancelError);
        });

        it('should throw if input is not array or string', () => {
            assert.throws(() => {
                require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(123, 10, context, 'submissionTypes');
            }, context.CancelError);
        });

        it('should not throw when maxItems is Infinity', () => {
            const largeArray = Array.from({ length: 50 }, (_, i) => `submission_type_${i + 1}`);
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(largeArray, Infinity, context, 'submissionTypes');
            assert.deepStrictEqual(result, largeArray);
        });

        it('should handle Canvas submission types', () => {
            const canvasSubmissionTypes = ['online_quiz', 'on_paper', 'discussion_topic', 'external_tool', 'online_upload', 'online_text_entry', 'online_url', 'media_recording', 'student_annotation'];
            const result = require('../../src/appmixer/canvas/lib').normalizeMultiselectInput(canvasSubmissionTypes, 10, context, 'submissionTypes');
            assert.deepStrictEqual(result, canvasSubmissionTypes);
        });
    });
});
