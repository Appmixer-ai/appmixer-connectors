const assert = require('assert');
const testUtils = require('../../../../../test/utils.js');

describe('CreateInvoice', function() {

    let context;

    beforeEach(function() {
        context = {
            ...testUtils.createMockContext(),
            profileInfo: { companyId: 'companyId' },
            messages: { in: { content: {} } }
        };
    });

    it('should fail with no line items', async function() {

        const action = require('../../accounting/CreateInvoice/CreateInvoice');

        await assert.rejects(
            async () => {
                await action.receive(context);
            },
            (err) => {
                return err instanceof context.CancelError &&
                    err.message === 'Invalid JSON in "Line Items JSON"';
            }
        );
    });
});
