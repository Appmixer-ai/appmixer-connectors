const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const CreateUserList = require('../../core/CreateUserList/CreateUserList');
const { applyGoogleAdsConfig } = require('./helpers');

describe('CreateUserList', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        applyGoogleAdsConfig(context);
    });

    it('throws when name is missing', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token'
        };

        await assert.rejects(() => CreateUserList.receive(context), {
            message: 'Name is required!'
        });
    });

    it('creates user list and returns resourceName', async () => {
        context.messages.in.content = {
            customerId: '123-456-7890',
            developerToken: 'dev-token',
            name: 'My Audience',
            membershipLifeSpan: 30
        };
        context.httpRequest.resolves({
            data: {
                results: [
                    { resourceName: 'customers/1234567890/userLists/999' }
                ]
            }
        });

        await CreateUserList.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].resourceName, 'customers/1234567890/userLists/999');
    });
});
