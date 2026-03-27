const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const ListAccessibleCustomers = require('../../core/ListAccessibleCustomers/ListAccessibleCustomers');
const { applyGoogleAdsConfig } = require('./helpers');

describe('ListAccessibleCustomers', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        applyGoogleAdsConfig(context);
    });

    it('throws when developer token is missing in backoffice config', async () => {
        context.config = {};

        await assert.rejects(() => ListAccessibleCustomers.receive(context), {
            message: 'Developer Token is required in backoffice config!'
        });
    });

    it('returns accessible customers', async () => {
        context.messages.in.content = { developerToken: 'dev-token' };
        context.httpRequest.resolves({
            data: {
                resourceNames: ['customers/1234567890']
            }
        });

        await ListAccessibleCustomers.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
        assert.deepStrictEqual(context.sendJson.getCall(0).args[0], {
            resourceNames: ['customers/1234567890'],
            count: 1
        });
    });
});
