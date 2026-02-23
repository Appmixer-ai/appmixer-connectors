const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const AddUsersToOfflineUserDataJob = require('../../core/AddUsersToOfflineUserDataJob/AddUsersToOfflineUserDataJob');

describe('AddUsersToOfflineUserDataJob', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
    });

    it('throws when emails are missing', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            offlineUserDataJobResourceName: 'customers/123/offlineUserDataJobs/777'
        };

        await assert.rejects(() => AddUsersToOfflineUserDataJob.receive(context), {
            message: 'Emails are required!'
        });
    });

    it('sends operations for unique normalized emails', async () => {
        context.messages.in.content = {
            customerId: '123',
            developerToken: 'dev-token',
            offlineUserDataJobResourceName: 'customers/123/offlineUserDataJobs/777',
            emails: 'John@example.com\n john@example.com , jane@example.com'
        };
        context.httpRequest.resolves({ data: {} });

        await AddUsersToOfflineUserDataJob.receive(context);

        assert.strictEqual(context.httpRequest.callCount, 1);
        const payload = context.httpRequest.getCall(0).args[0].data;
        assert.strictEqual(payload.operations.length, 2);
        assert.strictEqual(context.sendJson.getCall(0).args[0].receivedOperations, 2);
    });
});
