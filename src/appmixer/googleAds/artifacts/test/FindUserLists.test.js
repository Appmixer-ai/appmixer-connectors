const assert = require('assert');
const testUtils = require('../../../../../test/utils');
const FindUserLists = require('../../core/FindUserLists/FindUserLists');

describe('FindUserLists', () => {

    let context;

    beforeEach(() => {
        context = testUtils.createMockContext();
        context.messages = { in: { content: {} } };
    });

    it('throws when customerId is missing', async () => {
        context.messages.in.content = { developerToken: 'dev-token' };

        await assert.rejects(() => FindUserLists.receive(context), {
            message: 'Customer ID is required!'
        });
    });

    it('returns notFound when empty rows', async () => {
        context.messages.in.content = {
            customerId: '123-456-7890',
            developerToken: 'dev-token'
        };
        context.httpRequest.resolves({ data: [{ results: [] }] });

        await FindUserLists.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'notFound');
    });

    it('returns result with count', async () => {
        context.messages.in.content = {
            customerId: '123-456-7890',
            developerToken: 'dev-token'
        };
        context.httpRequest.resolves({
            data: [{
                results: [
                    {
                        userList: {
                            resourceName: 'customers/1234567890/userLists/111',
                            id: '111',
                            name: 'Audience 1'
                        }
                    }
                ]
            }]
        });

        await FindUserLists.receive(context);

        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
        assert.strictEqual(context.sendJson.getCall(0).args[0].count, 1);
    });
});
