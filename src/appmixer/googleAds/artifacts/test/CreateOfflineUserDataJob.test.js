const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const CreateOfflineUserDataJob = require('../../core/CreateOfflineUserDataJob/CreateOfflineUserDataJob');

describe('CreateOfflineUserDataJob', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
    });

    it('throws when neither userListResourceName nor userListId is provided', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token'
        };

        await assert.rejects(() => CreateOfflineUserDataJob.receive(context), {
            message: 'User List ID or User List Resource Name is required!'
        });
    });

    it('returns resourceName and offlineUserDataJobId', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            userListResourceName: 'customers/123/userLists/456'
        };
        context.httpRequest.resolves({
            data: {
                resourceName: 'customers/123/offlineUserDataJobs/987654321'
            }
        });

        await CreateOfflineUserDataJob.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].offlineUserDataJobId, '987654321');
        assert.strictEqual(context.httpRequest.getCall(0).args[0].url, 'https://googleads.googleapis.com/v23/customers/123/offlineUserDataJobs:create');
        assert.deepStrictEqual(context.httpRequest.getCall(0).args[0].data, {
            job: {
                type: 'CUSTOMER_MATCH_USER_LIST',
                customerMatchUserListMetadata: {
                    userList: 'customers/123/userLists/456'
                }
            }
        });
    });
});
