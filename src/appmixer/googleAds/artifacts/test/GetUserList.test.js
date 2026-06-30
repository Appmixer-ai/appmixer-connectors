const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const GetUserList = require('../../core/GetUserList/GetUserList');
const { applyGoogleAdsConfig } = require('./helpers');

describe('GetUserList', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
        applyGoogleAdsConfig(context);
    });

    it('throws when userListId is missing', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token'
        };

        await assert.rejects(() => GetUserList.receive(context), {
            message: 'User List ID is required!'
        });
    });

    it('returns user list', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            userListId: '777'
        };
        context.httpRequest.resolves({
            data: [{
                results: [{
                    userList: {
                        resourceName: 'customers/123/userLists/777',
                        id: '777',
                        name: 'Audience 777'
                    }
                }]
            }]
        });

        await GetUserList.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
        assert.strictEqual(context.sendJson.getCall(0).args[0].id, '777');
    });
});
