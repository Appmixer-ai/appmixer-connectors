const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');

describe('CreateBill', function() {

    let context;
    const action = require('../../accounting/CreateBill/CreateBill');
    const LINE = '[{"DetailType":"AccountBasedExpenseLineDetail","Amount":100,"AccountBasedExpenseLineDetail":{"AccountRef":{"value":"7"}}}]';

    beforeEach(function() {
        context = {
            ...testUtils.createMockContext(),
            profileInfo: { companyId: 'companyId' },
            messages: { in: { content: {} } }
        };
        context.httpRequest = sinon.stub().resolves({ data: { Bill: { Id: '1' } } });
    });

    afterEach(function() {
        sinon.restore();
    });

    it('omits empty optional references and exchange rate', async function() {

        context.messages.in.content = {
            vendorId: '56', minorVersion: '75', lineItemsJSON: LINE, dueDate: '2030-02-10',
            currency: '', exchangeRate: '', apAccountId: '', privateNote: 'note'
        };
        await action.receive(context);

        const { data } = context.httpRequest.firstCall.args[0];
        assert.deepEqual(data.VendorRef, { value: '56' });
        assert.equal(data.PrivateNote, 'note');
        for (const field of ['CurrencyRef', 'ExchangeRate', 'APAccountRef', 'SalesTermRef', 'DepartmentRef']) {
            assert.ok(!(field in data), field + ' should be omitted');
        }
        assert.equal(context.sendJson.firstCall.args[1], 'out');
    });

    it('sends references and exchange rate when set', async function() {

        context.messages.in.content = {
            vendorId: '56', minorVersion: '75', lineItemsJSON: LINE,
            currency: 'EUR', exchangeRate: 1.1, apAccountId: '33', salesTermId: '3', departmentId: '2'
        };
        await action.receive(context);

        const { data } = context.httpRequest.firstCall.args[0];
        assert.deepEqual(data.CurrencyRef, { value: 'EUR' });
        assert.equal(data.ExchangeRate, 1.1);
        assert.deepEqual(data.APAccountRef, { value: '33' });
        assert.deepEqual(data.SalesTermRef, { value: '3' });
        assert.deepEqual(data.DepartmentRef, { value: '2' });
    });

    it('fails with a CancelError naming the missing required input', async function() {

        context.messages.in.content = { minorVersion: '75', lineItemsJSON: LINE };
        await assert.rejects(() => action.receive(context), /Vendor ID is required/);

        context.messages.in.content = { vendorId: '56', minorVersion: '75' };
        await assert.rejects(() => action.receive(context), /Line Items JSON is required/);

        assert.equal(context.httpRequest.callCount, 0);
    });
});
