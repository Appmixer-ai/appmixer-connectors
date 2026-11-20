'use strict';

const assert = require('assert');
const path = require('path');

const core = path.join(__dirname, '../../src/appmixer/prestashop/core');
const ChangeOrderStatus = require(path.join(core, 'ChangeOrderStatus/ChangeOrderStatus.js'));
const ListOrderStatuses = require(path.join(core, 'ListOrderStatuses/ListOrderStatuses.js'));
const FindCustomerThreads = require(path.join(core, 'FindCustomerThreads/FindCustomerThreads.js'));

class CancelError extends Error {}

function mockContext({ content = {}, properties = {}, response = {}, fail } = {}) {

    const cache = {};
    const context = {
        auth: { shopUrl: 'https://shop.example.com/', apiKey: 'KEY' },
        config: {},
        properties,
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        flowDescriptor: {},
        async httpRequest(options) {
            context.requests.push(options);
            if (fail) throw fail;
            return { data: response };
        },
        async sendJson(data, port) {
            context.sent.push({ data, port });
        },
        async lock() {
            return { unlock: async () => {} };
        },
        staticCache: {
            async get(key) { return cache[key]; },
            async set(key, value) { cache[key] = value; }
        }
    };
    return context;
}

describe('prestashop ChangeOrderStatus', function() {

    it('POSTs an order_history XML and returns the created record', async function() {

        const created = { id: 42, id_order: '1', id_order_state: '7', id_employee: '0', date_add: '2026-11-20 10:00:00' };
        const context = mockContext({
            content: { orderId: '1', orderStateId: '7' },
            response: { order_history: created }
        });

        await ChangeOrderStatus.receive(context);

        const [req] = context.requests;
        assert.strictEqual(req.method, 'POST');
        assert.strictEqual(req.url, 'https://shop.example.com/api/order_histories');
        assert.deepStrictEqual(req.params, { output_format: 'JSON' });
        assert.strictEqual(req.headers['Content-Type'], 'text/xml');
        assert.ok(req.data.includes('<order_history>'));
        assert.ok(req.data.includes('<id_order><![CDATA[1]]></id_order>'));
        assert.ok(req.data.includes('<id_order_state><![CDATA[7]]></id_order_state>'));
        assert.deepStrictEqual(context.sent, [{ data: created, port: 'out' }]);
    });

    it('adds sendemail=1 when the customer is to be notified', async function() {

        const context = mockContext({
            content: { orderId: '1', orderStateId: '4', sendEmail: true },
            response: { order_history: { id: 1 } }
        });

        await ChangeOrderStatus.receive(context);

        assert.strictEqual(context.requests[0].params.sendemail, 1);
    });

    it('requires order ID and order status', async function() {

        await assert.rejects(ChangeOrderStatus.receive(mockContext({ content: { orderStateId: '7' } })), /Order ID/);
        await assert.rejects(ChangeOrderStatus.receive(mockContext({ content: { orderId: '1' } })), /Order Status/);
    });
});

describe('prestashop ListOrderStatuses', function() {

    const response = {
        order_states: [
            { id: 4, name: [{ id: '1', value: 'Shipped' }] },
            { id: 7, name: 'Refunded' }
        ]
    };

    it('lists states with resolved names and maps them to dropdown options', async function() {

        const context = mockContext({ response });

        await ListOrderStatuses.receive(context);

        const { data } = context.sent[0];
        assert.deepStrictEqual(data.result, [{ id: '4', name: 'Shipped' }, { id: '7', name: 'Refunded' }]);
        assert.deepStrictEqual(ListOrderStatuses.toSelectArray(data), [
            { label: 'Shipped (4)', value: '4' },
            { label: 'Refunded (7)', value: '7' }
        ]);
    });

    it('caches source calls and returns an empty list when the source call fails', async function() {

        const context = mockContext({ properties: { isSource: true }, response });
        await ListOrderStatuses.receive(context);
        await ListOrderStatuses.receive(context);
        assert.strictEqual(context.requests.length, 1);

        const failing = mockContext({ properties: { isSource: true }, fail: new Error('down') });
        await ListOrderStatuses.receive(failing);
        assert.deepStrictEqual(failing.sent[0].data, { result: [] });

        await assert.rejects(ListOrderStatuses.receive(mockContext({ fail: new Error('down') })), /down/);
    });
});

describe('prestashop FindCustomerThreads', function() {

    it('applies only the filters that are set', async function() {

        const context = mockContext({
            content: { customerId: '2', status: 'open', outputType: 'array' },
            response: { customer_threads: [{ id: 3 }, { id: 1 }] }
        });

        await FindCustomerThreads.receive(context);

        const { params } = context.requests[0];
        assert.strictEqual(params['filter[id_customer]'], '[2]');
        assert.strictEqual(params['filter[status]'], '[open]');
        assert.strictEqual(params['filter[email]'], undefined);
        assert.strictEqual(params['filter[id_order]'], undefined);
        assert.strictEqual(params.date, 1);
        assert.deepStrictEqual(context.sent[0], { data: { result: [{ id: 3 }, { id: 1 }], count: 2 }, port: 'out' });
    });

    it('sends to notFound when nothing matches (PrestaShop returns [] for an empty list)', async function() {

        const context = mockContext({ content: { email: 'nobody@example.com' }, response: [] });

        await FindCustomerThreads.receive(context);

        assert.deepStrictEqual(context.sent, [{ data: {}, port: 'notFound' }]);
    });
});
