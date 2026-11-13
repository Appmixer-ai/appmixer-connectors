const assert = require('assert');

const CreatePayment = require('../../books/CreatePayment/CreatePayment');
const FindInvoices = require('../../books/FindInvoices/FindInvoices');
const CreateEstimate = require('../../books/CreateEstimate/CreateEstimate');
const NewInvoice = require('../../books/NewInvoice/NewInvoice');
const NewContact = require('../../books/NewContact/NewContact');
const { formatTime } = require('../../books/lib');

class CancelError extends Error {}

/**
 * Component context whose HTTP client answers with `respond(request)` and records every request.
 */
function createContext({ content = {}, properties = {}, state = {}, respond = () => ({}) } = {}) {

    const requests = [];
    const sent = [];
    const httpRequest = () => {};
    httpRequest.create = () => async (request) => {
        requests.push(request);
        return { data: await respond(request) };
    };
    const context = {
        auth: { accessToken: 'token' },
        profileInfo: { region: 'us' },
        httpRequest,
        messages: { in: { content } },
        properties,
        state,
        config: {},
        CancelError,
        sendJson: async (data, port) => { sent.push({ data, port }); },
        saveState: async (newState) => { context.state = newState; }
    };
    return { context, requests, sent };
}

describe('Zoho Books components', () => {

    describe('CreatePayment', () => {

        it('applies the whole amount to the single invoice by default', async () => {

            const { context, requests, sent } = createContext({
                content: {
                    organizationId: '111',
                    customerId: '222',
                    paymentMode: 'banktransfer',
                    amount: 450,
                    date: '2026-11-13T00:00:00+02:00',
                    invoiceId: '333',
                    referenceNumber: 'ch_123'
                },
                respond: () => ({ payment: { payment_id: '444' } })
            });

            await CreatePayment.receive(context);

            assert.strictEqual(requests.length, 1);
            assert.strictEqual(requests[0].method, 'POST');
            assert.strictEqual(requests[0].url, '/books/v3/customerpayments');
            assert.deepStrictEqual(requests[0].params, { organization_id: '111' });
            assert.deepStrictEqual(requests[0].data, {
                customer_id: '222',
                payment_mode: 'banktransfer',
                amount: 450,
                reference_number: 'ch_123',
                date: '2026-11-13',
                invoices: [{ invoice_id: '333', amount_applied: 450 }]
            });
            assert.deepStrictEqual(sent, [{ data: { payment_id: '444' }, port: 'out' }]);
        });

        it('takes the Invoices JSON over Invoice ID', async () => {

            const { context, requests } = createContext({
                content: {
                    customerId: '222', paymentMode: 'cash', amount: 30, date: '2026-11-13', invoiceId: '999',
                    invoices: '[{"invoice_id": "1", "amount_applied": 10}, {"invoice_id": "2", "amount_applied": 20}]'
                },
                respond: () => ({ payment: {} })
            });

            await CreatePayment.receive(context);

            assert.deepStrictEqual(requests[0].data.invoices, [
                { invoice_id: '1', amount_applied: 10 },
                { invoice_id: '2', amount_applied: 20 }
            ]);
        });

        it('refuses a payment without an invoice', async () => {

            const { context, requests } = createContext({
                content: { customerId: '222', paymentMode: 'cash', amount: 30, date: '2026-11-13' }
            });

            await assert.rejects(CreatePayment.receive(context), CancelError);
            assert.strictEqual(requests.length, 0);
        });
    });

    describe('CreateEstimate', () => {

        it('sends the line items as JSON and the flags as query parameters', async () => {

            const { context, requests, sent } = createContext({
                content: {
                    organizationId: '111', customerId: '222', lineItems: '[{"item_id": "5", "quantity": 2}]',
                    expiryDate: '2026-11-30', send: false
                },
                respond: () => ({ estimate: { estimate_id: '777' } })
            });

            await CreateEstimate.receive(context);

            assert.deepStrictEqual(requests[0].params, { organization_id: '111', send: false });
            assert.deepStrictEqual(requests[0].data, {
                customer_id: '222', expiry_date: '2026-11-30', line_items: [{ item_id: '5', quantity: 2 }]
            });
            assert.deepStrictEqual(sent[0].data, { estimate_id: '777' });
        });
    });

    describe('FindInvoices', () => {

        it('maps the filters to the API parameters', async () => {

            const { context, requests, sent } = createContext({
                content: {
                    organizationId: '111', customerId: '222', status: 'unpaid', referenceNumber: 'PO-1',
                    dateStart: '2026-11-01', outputType: 'first'
                },
                respond: () => ({ invoices: [{ invoice_id: '1' }, { invoice_id: '2' }] })
            });

            await FindInvoices.receive(context);

            assert.deepStrictEqual(requests[0].params, {
                organization_id: '111', customer_id: '222', status: 'unpaid', reference_number: 'PO-1',
                sort_column: 'created_time', sort_order: 'D', page: 1, per_page: 200, date_start: '2026-11-01'
            });
            assert.deepStrictEqual(sent, [{ data: { invoice_id: '1', index: 0, count: 2 }, port: 'out' }]);
        });

        it('sends to notFound when nothing matches', async () => {

            const { context, sent } = createContext({
                content: { invoiceNumber: 'INV-404', outputType: 'array' },
                respond: () => ({ invoices: [] })
            });

            await FindInvoices.receive(context);

            assert.deepStrictEqual(sent, [{ data: {}, port: 'notFound' }]);
        });
    });

    describe('NewInvoice created or updated', () => {

        it('fires once per change of an invoice', async () => {

            let listing = [];
            const respond = (request) => {
                if (request.url === '/books/v3/invoices') {
                    return { invoices: listing };
                }
                return { invoice: { invoice_id: request.url.split('/').pop(), full: true } };
            };
            const { context, requests, sent } = createContext({
                properties: { organizationId: '111', events: 'created_or_updated' },
                respond
            });

            // Zoho timestamps have a one second resolution.
            const baselineTime = formatTime(Math.floor(Date.now() / 1000) * 1000);
            const changeTime = formatTime(Math.floor(Date.now() / 1000) * 1000 + 5 * 60 * 1000);

            // Baseline.
            listing = [{ invoice_id: '1', last_modified_time: baselineTime }];
            await NewInvoice.tick(context);
            assert.strictEqual(sent.length, 0);
            assert.ok(requests[0].params.last_modified_time);

            // The same version again: nothing.
            await NewInvoice.tick(context);
            assert.strictEqual(sent.length, 0);

            // The invoice was sent: fires with the full invoice.
            listing = [{ invoice_id: '1', last_modified_time: changeTime }];
            await NewInvoice.tick(context);
            assert.deepStrictEqual(sent, [{ data: { invoice_id: '1', full: true }, port: 'out' }]);
            const lastList = requests.filter(r => r.url === '/books/v3/invoices').pop();
            assert.strictEqual(lastList.params.last_modified_time, baselineTime);

            // Nothing changed since.
            await NewInvoice.tick(context);
            assert.strictEqual(sent.length, 1);
        });
    });

    describe('NewContact', () => {

        it('fires for contacts created after the baseline only', async () => {

            let listing = [{ contact_id: '1', created_time: '2026-11-13T07:00:00+0000' }];
            const { context, requests, sent } = createContext({
                properties: { organizationId: '111', contactType: 'customer' },
                respond: () => ({ contacts: listing })
            });

            await NewContact.tick(context);
            assert.strictEqual(sent.length, 0);
            assert.strictEqual(requests[0].params.contact_type, 'customer');
            assert.strictEqual(requests[0].params.sort_column, 'created_time');

            listing = [
                { contact_id: '2', created_time: '2026-11-13T07:05:00+0000' },
                { contact_id: '1', created_time: '2026-11-13T07:00:00+0000' }
            ];
            await NewContact.tick(context);
            assert.deepStrictEqual(sent.map(s => s.data.contact_id), ['2']);

            // An empty answer keeps the state.
            listing = [];
            await NewContact.tick(context);
            listing = [
                { contact_id: '2', created_time: '2026-11-13T07:05:00+0000' },
                { contact_id: '1', created_time: '2026-11-13T07:00:00+0000' }
            ];
            await NewContact.tick(context);
            assert.strictEqual(sent.length, 1);
        });
    });
});
