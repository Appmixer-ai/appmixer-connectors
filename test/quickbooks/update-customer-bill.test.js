'use strict';

const path = require('path');
const assert = require('assert');

const accounting = path.join(__dirname, '../../src/appmixer/quickbooks/accounting');
const updateCustomer = require(path.join(accounting, 'UpdateCustomer/UpdateCustomer.js'));
const updateBill = require(path.join(accounting, 'UpdateBill/UpdateBill.js'));

class CancelError extends Error {}

// Minimal context: httpRequest replays queued responses (or throws queued errors) and records each call.
const createContext = (content, responses) => {
    const calls = [];
    const sent = [];
    return {
        calls,
        sent,
        CancelError,
        auth: { accessToken: 'token' },
        config: { sandbox: true },
        profileInfo: { companyId: '4620816365235066750' },
        messages: { in: { content } },
        log: async () => {},
        httpRequest: async (options) => {
            calls.push(options);
            const next = responses.shift();
            if (next instanceof Error) throw next;
            return next;
        },
        sendJson: async (data, port) => sent.push({ data, port })
    };
};

const staleError = () => {
    const err = new Error('Request failed with status code 400');
    err.response = { data: { Fault: { Error: [{ code: '5010', Message: 'Stale Object Error' }], type: 'ValidationFault' } } };
    return err;
};

describe('QuickBooks UpdateCustomer', function() {

    const customer = (syncToken) => ({
        data: {
            Customer: {
                Id: '58',
                SyncToken: syncToken,
                BillAddr: { Id: '12', Line1: '1 Main St', City: 'Prague', PostalCode: '11000' }
            }
        }
    });

    it('sends only the filled-in fields and merges the billing address into the current one', async function() {

        const context = createContext(
            { customerId: '58', givenName: 'E2EUpdated', familyName: '', primaryEmailAddrAddress: 'a@b.com', billAddrCity: 'Brno' },
            [customer('2'), customer('3')]
        );

        await updateCustomer.receive(context);

        assert.deepStrictEqual(context.calls.map(c => c.method), ['GET', 'POST']);
        assert.match(context.calls[0].url, /\/v3\/company\/4620816365235066750\/customer\/58\?minorversion=75$/);
        assert.match(context.calls[1].url, /\/customer\?minorversion=75$/);
        assert.deepStrictEqual(context.calls[1].data, {
            Id: '58',
            SyncToken: '2',
            sparse: true,
            GivenName: 'E2EUpdated',
            PrimaryEmailAddr: { Address: 'a@b.com' },
            BillAddr: { Id: '12', Line1: '1 Main St', City: 'Brno', PostalCode: '11000' }
        });
        assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
    });

    it('retries once with a fresh SyncToken on a stale-object error', async function() {

        const context = createContext({ customerId: '58', notes: 'x' }, [customer('2'), staleError(), customer('4'), customer('5')]);

        await updateCustomer.receive(context);

        assert.deepStrictEqual(context.calls.map(c => c.method), ['GET', 'POST', 'GET', 'POST']);
        assert.strictEqual(context.calls[3].data.SyncToken, '4');
        assert.strictEqual(context.calls[3].data.Notes, 'x');
    });

    it('rejects a missing ID and an empty change set before calling the API', async function() {

        for (const content of [{ givenName: 'x' }, { customerId: '58' }, { customerId: '58', givenName: '' }]) {
            const context = createContext(content, []);
            await assert.rejects(updateCustomer.receive(context), CancelError);
            assert.strictEqual(context.calls.length, 0);
        }
    });
});

describe('QuickBooks UpdateBill', function() {

    const bill = (syncToken) => ({
        data: { Bill: { Id: '250', SyncToken: syncToken, VendorRef: { value: '55', name: 'Cloud Hosting' } } }
    });

    it('sends the current VendorRef along with the filled-in fields', async function() {

        const context = createContext(
            { billId: '250', privateNote: 'E2E updated bill note', docNumber: '' },
            [bill('1'), bill('2')]
        );

        await updateBill.receive(context);

        assert.deepStrictEqual(context.calls.map(c => c.method), ['GET', 'POST']);
        assert.match(context.calls[0].url, /\/bill\/250\?minorversion=75$/);
        assert.deepStrictEqual(context.calls[1].data, {
            Id: '250',
            SyncToken: '1',
            sparse: true,
            VendorRef: { value: '55', name: 'Cloud Hosting' },
            PrivateNote: 'E2E updated bill note'
        });
        assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
    });

    it('uses the given vendor instead of the current one', async function() {

        const context = createContext({ billId: '250', vendorId: 77 }, [bill('1'), bill('2')]);

        await updateBill.receive(context);

        assert.deepStrictEqual(context.calls[1].data.VendorRef, { value: '77' });
    });

    it('retries once on a stale-object error and does not retry other errors', async function() {

        const retried = createContext({ billId: '250', privateNote: 'x' }, [bill('1'), staleError(), bill('3'), bill('4')]);
        await updateBill.receive(retried);
        assert.deepStrictEqual(retried.calls.map(c => c.method), ['GET', 'POST', 'GET', 'POST']);
        assert.strictEqual(retried.calls[3].data.SyncToken, '3');

        const err = new Error('400');
        err.response = { data: { Fault: { Error: [{ code: '2020', Message: 'Required param missing' }] } } };
        const failed = createContext({ billId: '250', privateNote: 'x' }, [bill('1'), err]);
        await assert.rejects(updateBill.receive(failed), e => e.Fault?.Error?.[0]?.code === '2020');
        assert.strictEqual(failed.calls.length, 2);
    });

    it('rejects a missing ID, an empty change set and invalid line JSON before calling the API', async function() {

        for (const content of [
            { privateNote: 'x' },
            { billId: '250' },
            { billId: '250', lineItemsJSON: '{not json' },
            { billId: '250', lineItemsJSON: '[]' }
        ]) {
            const context = createContext(content, []);
            await assert.rejects(updateBill.receive(context), CancelError);
            assert.strictEqual(context.calls.length, 0);
        }
    });
});
