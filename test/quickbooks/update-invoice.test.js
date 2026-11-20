'use strict';

const path = require('path');
const assert = require('assert');

const component = require(path.join(__dirname, '../../src/appmixer/quickbooks/accounting/UpdateInvoice/UpdateInvoice.js'));

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

const invoice = (syncToken) => ({ data: { Invoice: { Id: '130', SyncToken: syncToken } } });

const staleError = () => {
    const err = new Error('Request failed with status code 400');
    err.response = { data: { Fault: { Error: [{ code: '5010', Message: 'Stale Object Error' }], type: 'ValidationFault' } } };
    return err;
};

describe('QuickBooks UpdateInvoice', function() {

    it('reads the SyncToken, then sends only the filled-in fields as a sparse update', async function() {

        const context = createContext(
            { invoiceId: '130', privateNote: 'E2E updated note', docNumber: '', dueDate: '2026-12-31' },
            [invoice('3'), invoice('4')]
        );

        await component.receive(context);

        assert.strictEqual(context.calls.length, 2);
        assert.strictEqual(context.calls[0].method, 'GET');
        assert.match(context.calls[0].url, /\/v3\/company\/4620816365235066750\/invoice\/130\?minorversion=75$/);
        assert.strictEqual(context.calls[1].method, 'POST');
        assert.deepStrictEqual(context.calls[1].data, {
            Id: '130',
            SyncToken: '3',
            sparse: true,
            PrivateNote: 'E2E updated note',
            DueDate: '2026-12-31'
        });
        assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
    });

    it('retries once with a fresh SyncToken when the invoice changed in between', async function() {

        const context = createContext(
            { invoiceId: '130', privateNote: 'x' },
            [invoice('3'), staleError(), invoice('5'), invoice('6')]
        );

        await component.receive(context);

        assert.deepStrictEqual(context.calls.map(c => c.method), ['GET', 'POST', 'GET', 'POST']);
        assert.strictEqual(context.calls[3].data.SyncToken, '5');
        assert.deepStrictEqual(context.sent, [{ data: {}, port: 'out' }]);
    });

    it('does not retry other QuickBooks errors', async function() {

        const err = new Error('400');
        err.response = { data: { Fault: { Error: [{ code: '6000', Message: 'Business Validation Error' }] } } };
        const context = createContext({ invoiceId: '130', privateNote: 'x' }, [invoice('3'), err]);

        await assert.rejects(component.receive(context), e => e.Fault?.Error?.[0]?.code === '6000');
        assert.strictEqual(context.calls.length, 2);
    });

    it('rejects a missing ID, an empty change set and invalid line JSON before calling the API', async function() {

        for (const content of [
            { privateNote: 'x' },
            { invoiceId: '130' },
            { invoiceId: '130', lineItemsJSON: '{not json' },
            { invoiceId: '130', lineItemsJSON: '[]' }
        ]) {
            const context = createContext(content, []);
            await assert.rejects(component.receive(context), CancelError);
            assert.strictEqual(context.calls.length, 0);
        }
    });
});
