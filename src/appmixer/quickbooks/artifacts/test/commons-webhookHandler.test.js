const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const commons = require('../../commons');

describe('commons.webhookHandler', function() {

    let context;

    beforeEach(function() {
        context = {
            ...testUtils.createMockContext(),
            profileInfo: { companyId: 'companyId' },
            lock: sinon.stub().resolves({ unlock: sinon.stub().resolves() }),
            sendArray: sinon.stub().resolves(),
            log: sinon.stub().resolves(),
            messages: { webhook: { content: { data: ['2001'] } } }
        };
    });

    afterEach(function() {
        sinon.restore();
    });

    it('emits the records returned by the query', async function() {

        sinon.stub(commons, 'makeRequest').resolves({ data: { QueryResponse: { Bill: [{ Id: '2001' }] } } });
        await commons.webhookHandler(context, 'Bill');
        assert.equal(context.sendArray.callCount, 1);
        assert.deepEqual(context.sendArray.firstCall.args, [[{ Id: '2001' }], 'out']);
    });

    it('does not emit when the query matches nothing', async function() {

        sinon.stub(commons, 'makeRequest').resolves({ data: { QueryResponse: {} } });
        await commons.webhookHandler(context, 'Bill');
        assert.equal(context.sendArray.callCount, 0);
    });

    it('does not throw when QueryResponse is missing', async function() {

        sinon.stub(commons, 'makeRequest').resolves({ data: {} });
        await commons.webhookHandler(context, 'Bill');
        assert.equal(context.sendArray.callCount, 0);
    });
});
