const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const RunOfflineUserDataJob = require('../../core/RunOfflineUserDataJob/RunOfflineUserDataJob');

describe('RunOfflineUserDataJob', () => {

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

        await assert.rejects(() => RunOfflineUserDataJob.receive(context), {
            message: 'Offline User Data Job ID is required!'
        });
    });

    it('requests run and returns confirmation', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            offlineUserDataJobId: '777-888'
        };
        context.httpRequest.resolves({ data: {} });

        await RunOfflineUserDataJob.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[0].offlineUserDataJobId, '777888');
        assert.strictEqual(context.sendJson.getCall(0).args[0].status, 'RUN_REQUESTED');
    });
});
