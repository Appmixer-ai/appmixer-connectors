const assert = require('assert');
const testUtils = require('../../../../../../test/utils.js');
const TransformTextToJSON = require('../../TransformTextToJSON/TransformTextToJSON');

describe('ai.gemini TransformTextToJSON', () => {
    let context;
    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: { jsonSchema: '{invalid}' } } };
    });

    it('should throw context.CancelError for invalid JSON schema', async () => {
        let threw = false;
        try {
            await TransformTextToJSON.receive(context);
        } catch (err) {
            threw = true;
            assert(err instanceof context.CancelError, 'Should throw context.CancelError');
        }
        assert(threw, 'Should throw for invalid JSON schema');
    });
});
