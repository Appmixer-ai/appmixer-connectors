'use strict';

const assert = require('assert');
const sinon = require('sinon');
const testUtils = require('../../../../../test/utils.js');
const lib = require('../../lib');

const CreateSubscription = require('../../core/CreateSubscription/CreateSubscription');
const CancelSubscription = require('../../core/CancelSubscription/CancelSubscription');
const CreateCheckoutSession = require('../../core/CreateCheckoutSession/CreateCheckoutSession');
const CreatePaymentLink = require('../../core/CreatePaymentLink/CreatePaymentLink');
const CreateInvoiceItem = require('../../core/CreateInvoiceItem/CreateInvoiceItem');
const NewPayment = require('../../core/NewPayment/NewPayment');
const PaymentFailed = require('../../core/PaymentFailed/PaymentFailed');
const SubscriptionChanged = require('../../core/SubscriptionChanged/SubscriptionChanged');

function createContext(content = {}, properties = {}) {

    const context = testUtils.createMockContext();
    context.auth = { apiKey: 'sk_test_123' };
    context.messages = { in: { content } };
    context.properties = properties;
    context.flowId = 'flow-1';
    context.httpRequest.resolves({ data: { id: 'obj_1' } });
    return context;
}

function sentForm(context, call = 0) {

    return new URLSearchParams(context.httpRequest.getCall(call).args[0].data);
}

describe('stripe lib', () => {

    it('toFormBody encodes nested objects and arrays in bracket notation', () => {

        const body = new URLSearchParams(lib.toFormBody({
            customer: 'cus_1',
            items: [{ price: 'price_1', quantity: 2 }, { price: 'price_2', quantity: 1 }],
            metadata: { orderId: '1001' },
            skipped: undefined
        }));
        assert.strictEqual(body.get('customer'), 'cus_1');
        assert.strictEqual(body.get('items[0][price]'), 'price_1');
        assert.strictEqual(body.get('items[0][quantity]'), '2');
        assert.strictEqual(body.get('items[1][price]'), 'price_2');
        assert.strictEqual(body.get('metadata[orderId]'), '1001');
        assert.strictEqual(body.has('skipped'), false);
    });

    it('normalizeLineItems reads the expression value, arrays and JSON strings', () => {

        const context = createContext();
        assert.deepStrictEqual(
            lib.normalizeLineItems(context, { AND: [{ price: 'price_1', quantity: 3 }, { price: 'price_2' }, { price: '' }] }),
            [{ price: 'price_1', quantity: 3 }, { price: 'price_2', quantity: 1 }]
        );
        assert.deepStrictEqual(lib.normalizeLineItems(context, '[{"price":"price_9","quantity":"2"}]'), [{ price: 'price_9', quantity: 2 }]);
        assert.deepStrictEqual(lib.normalizeLineItems(context, undefined), []);
        assert.throws(() => lib.normalizeLineItems(context, { AND: [{ price: 'price_1', quantity: 1.5 }] }), /whole number/);
        assert.throws(() => lib.normalizeLineItems(context, 'not json'), /list of items/);
    });

    it('kvToObject parses the designer key-value string', () => {

        const context = createContext();
        assert.deepStrictEqual(lib.kvToObject(context, '{"orderId":"1001","n":5}', 'Metadata'), { orderId: '1001', n: '5' });
        assert.deepStrictEqual(lib.kvToObject(context, [{ key: 'a', value: 'b' }], 'Metadata'), { a: 'b' });
        assert.deepStrictEqual(lib.kvToObject(context, '', 'Metadata'), {});
    });

    it('stripeRequest pins the API version and form-encodes the body', async () => {

        const context = createContext();
        await lib.stripeRequest(context, { method: 'POST', path: '/v1/things', data: { a: 1 }, params: { types: ['x', 'y'] } });
        const options = context.httpRequest.firstCall.args[0];
        assert.strictEqual(options.headers['Stripe-Version'], lib.STRIPE_API_VERSION);
        assert.strictEqual(options.headers.Authorization, 'Bearer sk_test_123');
        assert.strictEqual(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
        assert.strictEqual(options.data, 'a=1');
        assert.strictEqual(options.url, 'https://api.stripe.com/v1/things?types%5B0%5D=x&types%5B1%5D=y');
    });
});

describe('stripe actions', () => {

    it('CreateSubscription sends items, trial and metadata', async () => {

        const context = createContext({
            customer: 'cus_1',
            items: { AND: [{ price: 'price_1', quantity: 2 }] },
            trialPeriodDays: 7,
            collectionMethod: 'charge_automatically',
            daysUntilDue: 30,
            metadata: '{"accountId":"acme"}'
        });
        await CreateSubscription.receive(context);

        const options = context.httpRequest.firstCall.args[0];
        assert.strictEqual(options.method, 'POST');
        assert.strictEqual(options.url, 'https://api.stripe.com/v1/subscriptions');
        const form = sentForm(context);
        assert.strictEqual(form.get('customer'), 'cus_1');
        assert.strictEqual(form.get('items[0][price]'), 'price_1');
        assert.strictEqual(form.get('items[0][quantity]'), '2');
        assert.strictEqual(form.get('trial_period_days'), '7');
        assert.strictEqual(form.get('metadata[accountId]'), 'acme');
        // days_until_due is valid only for send_invoice
        assert.strictEqual(form.has('days_until_due'), false);
        assert(context.sendJson.calledWith({ id: 'obj_1' }, 'out'));
    });

    it('CreateSubscription requires Days Until Due for Send Invoice', async () => {

        const context = createContext({ customer: 'cus_1', items: { AND: [{ price: 'price_1' }] }, collectionMethod: 'send_invoice' });
        await assert.rejects(() => CreateSubscription.receive(context), /Days Until Due/);
        assert.strictEqual(context.httpRequest.callCount, 0);
    });

    it('CancelSubscription sends DELETE with the flags as query parameters', async () => {

        const context = createContext({ subscriptionId: 'sub_1', invoiceNow: true, prorate: false, cancellationComment: 'Closed' });
        await CancelSubscription.receive(context);
        const options = context.httpRequest.firstCall.args[0];
        assert.strictEqual(options.method, 'DELETE');
        const url = new URL(options.url);
        assert.strictEqual(url.pathname, '/v1/subscriptions/sub_1');
        assert.strictEqual(url.searchParams.get('invoice_now'), 'true');
        assert.strictEqual(url.searchParams.get('prorate'), 'false');
        assert.strictEqual(url.searchParams.get('cancellation_details[comment]'), 'Closed');
        assert.strictEqual(options.data, undefined);
    });

    it('CancelSubscription reads toggles mapped from a variable as strings', async () => {

        const context = createContext({ subscriptionId: 'sub_1', invoiceNow: 'false', prorate: 'true' });
        await CancelSubscription.receive(context);
        const url = new URL(context.httpRequest.firstCall.args[0].url);
        assert.strictEqual(url.searchParams.get('invoice_now'), 'false');
        assert.strictEqual(url.searchParams.get('prorate'), 'true');
    });

    it('CreateCheckoutSession validates the mode-specific inputs', async () => {

        let context = createContext({ mode: 'payment', successUrl: 'https://example.com/ok' });
        await assert.rejects(() => CreateCheckoutSession.receive(context), /line item/);

        context = createContext({ mode: 'setup', successUrl: 'https://example.com/ok' });
        await assert.rejects(() => CreateCheckoutSession.receive(context), /Currency/);

        context = createContext({ mode: 'payment', successUrl: 'https://example.com/ok', customer: 'cus_1', customerEmail: 'a@example.com', lineItems: { AND: [{ price: 'price_1' }] } });
        await assert.rejects(() => CreateCheckoutSession.receive(context), /not both/);

        context = createContext({ mode: 'payment', successUrl: 'https://example.com/ok', cancelUrl: 'https://example.com/back', lineItems: { AND: [{ price: 'price_1', quantity: 2 }] }, clientReferenceId: 'order-1' });
        await CreateCheckoutSession.receive(context);
        const form = sentForm(context);
        assert.strictEqual(form.get('mode'), 'payment');
        assert.strictEqual(form.get('success_url'), 'https://example.com/ok');
        assert.strictEqual(form.get('cancel_url'), 'https://example.com/back');
        assert.strictEqual(form.get('line_items[0][price]'), 'price_1');
        assert.strictEqual(form.get('line_items[0][quantity]'), '2');
        assert.strictEqual(form.get('client_reference_id'), 'order-1');
    });

    it('CreatePaymentLink sets a redirect after completion', async () => {

        const context = createContext({ lineItems: { AND: [{ price: 'price_1', quantity: 1 }] }, redirectUrl: 'https://example.com/thanks' });
        await CreatePaymentLink.receive(context);
        const form = sentForm(context);
        assert.strictEqual(form.get('line_items[0][price]'), 'price_1');
        assert.strictEqual(form.get('after_completion[type]'), 'redirect');
        assert.strictEqual(form.get('after_completion[redirect][url]'), 'https://example.com/thanks');
    });

    it('CreateInvoiceItem sends a price or an amount, not both', async () => {

        let context = createContext({ customer: 'cus_1', price: 'price_1', quantity: 3, invoice: 'in_1' });
        await CreateInvoiceItem.receive(context);
        let form = sentForm(context);
        assert.strictEqual(form.get('pricing[price]'), 'price_1');
        assert.strictEqual(form.get('quantity'), '3');
        assert.strictEqual(form.get('invoice'), 'in_1');
        assert.strictEqual(form.has('amount'), false);

        context = createContext({ customer: 'cus_1', amount: 1500, currency: 'USD', quantity: 3 });
        await CreateInvoiceItem.receive(context);
        form = sentForm(context);
        assert.strictEqual(form.get('amount'), '1500');
        assert.strictEqual(form.get('currency'), 'usd');
        assert.strictEqual(form.has('quantity'), false);

        context = createContext({ customer: 'cus_1', price: 'price_1', amount: 100 });
        await assert.rejects(() => CreateInvoiceItem.receive(context), /not both/);
        context = createContext({ customer: 'cus_1', amount: 100 });
        await assert.rejects(() => CreateInvoiceItem.receive(context), /Currency/);
    });
});

describe('stripe webhook triggers', () => {

    const EVENT = {
        id: 'evt_1ABC',
        object: 'event',
        type: 'payment_intent.succeeded',
        created: 1680800504,
        livemode: false,
        data: { object: { id: 'pi_1', object: 'payment_intent', amount: 2000 } }
    };

    function webhookContext(payload, properties = {}) {

        const context = createContext({}, properties);
        context.messages = { webhook: { content: { data: payload } } };
        return context;
    }

    it('start registers an endpoint for the selected events and stop deletes it', async () => {

        const context = createContext({}, { events: ['customer.subscription.created'] });
        context.httpRequest.resolves({ data: { id: 'we_1' } });
        await SubscriptionChanged.start(context);

        const options = context.httpRequest.firstCall.args[0];
        assert.strictEqual(options.url, 'https://api.stripe.com/v1/webhook_endpoints');
        const form = new URLSearchParams(options.data);
        assert.strictEqual(form.get('url'), context.getWebhookUrl());
        assert.deepStrictEqual(form.getAll('enabled_events[0]'), ['customer.subscription.created']);
        assert.strictEqual(form.has('enabled_events[1]'), false);
        assert(context.saveState.calledWith({ webhookId: 'we_1' }));

        context.loadState = sinon.stub().resolves({ webhookId: 'we_1' });
        await SubscriptionChanged.stop(context);
        const del = context.httpRequest.secondCall.args[0];
        assert.strictEqual(del.method, 'DELETE');
        assert.strictEqual(del.url, 'https://api.stripe.com/v1/webhook_endpoints/we_1');
    });

    it('stop ignores an endpoint that is already deleted', async () => {

        const context = createContext();
        context.loadState = sinon.stub().resolves({ webhookId: 'we_1' });
        const notFound = new Error('Not found');
        notFound.response = { status: 404 };
        context.httpRequest.rejects(notFound);
        await PaymentFailed.stop(context);
    });

    it('PaymentFailed defaults to one event, so a failed invoice payment starts the flow once', async () => {

        const context = createContext({}, { events: [] });
        context.httpRequest.resolves({ data: { id: 'we_1' } });
        await PaymentFailed.start(context);
        const form = new URLSearchParams(context.httpRequest.firstCall.args[0].data);
        assert.strictEqual(form.get('enabled_events[0]'), 'payment_intent.payment_failed');
        assert.strictEqual(form.has('enabled_events[1]'), false);
    });

    it('PaymentFailed listens to both events when both are selected', async () => {

        const context = createContext({}, { events: ['payment_intent.payment_failed', 'invoice.payment_failed'] });
        context.httpRequest.resolves({ data: { id: 'we_1' } });
        await PaymentFailed.start(context);
        const form = new URLSearchParams(context.httpRequest.firstCall.args[0].data);
        assert.strictEqual(form.get('enabled_events[0]'), 'payment_intent.payment_failed');
        assert.strictEqual(form.get('enabled_events[1]'), 'invoice.payment_failed');
    });

    it('receive emits the event read back from Stripe, not the posted payload', async () => {

        const context = webhookContext({ id: 'evt_1ABC', type: 'payment_intent.succeeded', data: { object: { id: 'pi_forged', amount: 1 } } });
        context.httpRequest.resolves({ data: EVENT });
        await NewPayment.receive(context);

        assert.strictEqual(context.httpRequest.firstCall.args[0].url, 'https://api.stripe.com/v1/events/evt_1ABC');
        assert.strictEqual(context.sendJson.callCount, 1);
        const [output, port] = context.sendJson.firstCall.args;
        assert.strictEqual(port, 'out');
        assert.deepStrictEqual(output, {
            id: 'evt_1ABC',
            type: 'payment_intent.succeeded',
            created: 1680800504,
            livemode: false,
            data: { id: 'pi_1', object: 'payment_intent', amount: 2000 }
        });
        assert(context.response.calledOnce);
    });

    it('receive emits nothing for an event that is not in the account', async () => {

        const context = webhookContext({ id: 'evt_forged' });
        const notFound = new Error('Not found');
        notFound.response = { status: 404 };
        context.httpRequest.rejects(notFound);
        await NewPayment.receive(context);
        assert.strictEqual(context.sendJson.callCount, 0);
        assert(context.response.calledWith({}, 400));
    });

    it('receive rejects a payload without an event ID without calling Stripe', async () => {

        const context = webhookContext({ foo: 'bar' });
        await NewPayment.receive(context);
        assert.strictEqual(context.httpRequest.callCount, 0);
        assert.strictEqual(context.sendJson.callCount, 0);
        assert(context.response.calledWith({}, 400));
    });

    it('receive skips events of other types and repeated deliveries', async () => {

        let context = webhookContext({ id: 'evt_1ABC' }, { eventType: 'charge.succeeded' });
        context.httpRequest.resolves({ data: EVENT });
        await NewPayment.receive(context);
        assert.strictEqual(context.sendJson.callCount, 0);

        context = webhookContext({ id: 'evt_1ABC' });
        context.httpRequest.resolves({ data: EVENT });
        await NewPayment.receive(context);
        await NewPayment.receive(context);
        assert.strictEqual(context.sendJson.callCount, 1);
        assert.strictEqual(context.httpRequest.callCount, 1);
    });

    it('test emits the latest matching event in the receive() shape and throws when there is none', async () => {

        let context = createContext({}, { events: ['customer.subscription.updated'] });
        const updated = {
            ...EVENT,
            type: 'customer.subscription.updated',
            data: { object: { id: 'sub_1', status: 'active' }, previous_attributes: { status: 'trialing' } }
        };
        context.httpRequest.resolves({ data: { data: [updated] } });
        await SubscriptionChanged.test(context);
        const url = new URL(context.httpRequest.firstCall.args[0].url);
        assert.strictEqual(context.httpRequest.firstCall.args[0].method, 'GET');
        assert.strictEqual(url.searchParams.get('types[0]'), 'customer.subscription.updated');
        assert.strictEqual(url.searchParams.get('limit'), '1');
        assert.deepStrictEqual(context.sendJson.firstCall.args[0].previousAttributes, { status: 'trialing' });
        assert.strictEqual(context.saveState.callCount, 0);

        context = createContext();
        context.httpRequest.resolves({ data: { data: [] } });
        await assert.rejects(() => NewPayment.test(context), /No recent/);
    });
});
