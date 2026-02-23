const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const CreateOfflineUserDataJob = require('../../core/CreateOfflineUserDataJob/CreateOfflineUserDataJob');

describe('CreateOfflineUserDataJob', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
    });

    it('throws when userListResourceName is missing', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token'
        };

        await assert.rejects(() => CreateOfflineUserDataJob.receive(context), {
            message: 'User List Resource Name is required!'
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
                results: [
                    { resourceName: 'customers/123/offlineUserDataJobs/987654321' }
                ]
            }
        });

        await CreateOfflineUserDataJob.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].offlineUserDataJobId, '987654321');
    });
});
