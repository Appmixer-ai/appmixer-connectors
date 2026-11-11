const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const commons = require('../../commons');

describe('commons.processEntityCDC', function() {

    let context;

    beforeEach(function() {
        context = {
            ...testUtils.createMockContext(),
            componentId: 'cid',
            profileInfo: { companyId: 'companyId' },
            lock: sinon.stub().resolves({ unlock: sinon.stub() }),
            stateGet: sinon.stub().resolves({ changedSince: new Date('2026-01-01T00:00:00Z') }),
            stateSet: sinon.stub().resolves()
        };
    });

    afterEach(function() {
        sinon.restore();
    });

    for (const [label, queryResponse] of [['[]', []], ['[{}]', [{}]]]) {
        it(`handles an empty CDC result (QueryResponse ${label})`, async function() {

            context.httpRequest = sinon.stub().resolves({
                data: { CDCResponse: [{ QueryResponse: queryResponse }], time: '2026-01-02T00:00:00Z' }
            });
            await commons.processEntityCDC(context, 'Bill', 'new');

            assert.equal(context.sendJson.callCount, 0);
            assert.deepEqual(context.stateSet.lastCall.args, ['changedSince', { changedSince: new Date('2026-01-02T00:00:00Z') }]);
        });
    }

    it('emits only the entities matching the change type', async function() {

        const created = { Id: '1', MetaData: { CreateTime: 't1', LastUpdatedTime: 't1' } };
        const updated = { Id: '2', MetaData: { CreateTime: 't1', LastUpdatedTime: 't2' } };
        context.httpRequest = sinon.stub().resolves({
            data: { CDCResponse: [{ QueryResponse: [{ Bill: [created, updated] }] }], time: '2026-01-02T00:00:00Z' }
        });
        await commons.processEntityCDC(context, 'Bill', 'updated');

        assert.equal(context.sendJson.callCount, 1);
        assert.equal(context.sendJson.firstCall.args[0].Id, '2');
    });
});
