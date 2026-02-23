const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const GetOfflineUserDataJob = require('../../core/GetOfflineUserDataJob/GetOfflineUserDataJob');

describe('GetOfflineUserDataJob', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
    });

    it('throws when offlineUserDataJobId is missing', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token'
        };

        await assert.rejects(() => GetOfflineUserDataJob.receive(context), {
            message: 'Offline User Data Job ID is required!'
        });
    });

    it('returns job details when found', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            offlineUserDataJobId: '321'
        };
        context.httpRequest.resolves({
            data: [{
                results: [
                    {
                        offlineUserDataJob: {
                            resourceName: 'customers/123/offlineUserDataJobs/321',
                            id: '321',
                            status: 'SUCCESS'
                        }
                    }
                ]
            }]
        });

        await GetOfflineUserDataJob.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].id, '321');
    });
});
