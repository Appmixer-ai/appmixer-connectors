'use strict';

const assert = require('assert');
const sinon = require('sinon');
const amqp = require('amqplib');
const connections = require('../../connections');

const FLOW = 'flow-1';
const COMPONENT = 'component-1';
const STREAM = 'orders.stream';
const AUTH = { protocol: 'amqp', hostname: 'localhost', port: 5672, username: 'guest', password: 'guest', vhost: '/' };
const OFFSET_KEY = `offset:${FLOW}:${COMPONENT}`;

const streamOptions = (offset, filterValue) => ({
    noAck: false,
    prefetch: 100,
    arguments: { 'x-stream-offset': offset, 'x-stream-filter': filterValue }
});

// A stream delivery as the broker sends it: the offset in a header, and the filter value the publisher set.
const delivery = (offset, filterValue) => ({
    content: Buffer.from(JSON.stringify({ offset })),
    fields: { deliveryTag: offset + 1 },
    properties: { headers: { 'x-stream-offset': offset, 'x-stream-filter-value': filterValue } }
});

// A broker that records what the plugin asked for and hands the test the delivery callback.
function fakeBroker({ probeOffset } = {}) {

    const seen = { prefetch: [], subscriptions: [], acked: [] };
    let consumerCallback = null;

    const channel = () => ({
        on: () => {},
        close: async () => {},
        prefetch: async (count, global) => { seen.prefetch.push({ count, global }); },
        ack: (message) => { seen.acked.push((message.properties.headers || {})['x-stream-offset'] ?? null); },
        consume: async (queue, callback, options) => {
            seen.subscriptions.push({ queue, options });
            // The truncation probe is the only subscription whose options are nothing but stream arguments.
            if (options && options.arguments && Object.keys(options).length === 1) {
                if (probeOffset !== undefined) await callback(delivery(probeOffset, 'probe'));
            } else {
                consumerCallback = callback;
            }
            return { consumerTag: 'consumer-tag' };
        }
    });

    sinon.stub(amqp, 'connect').resolves({
        on: () => {},
        close: async () => {},
        createChannel: async () => channel()
    });

    return {
        seen,
        deliver: async (...messages) => {
            for (const message of messages) {
                await consumerCallback(message);
            }
        },
        // Hands every delivery over without waiting, as the broker does when prefetch allows more than one.
        deliverAtOnce: (...messages) => Promise.all(messages.map((message) => consumerCallback(message)))
    };
}

function fakeContext() {

    const state = new Map();
    const triggered = [];

    return {
        state,
        triggered,
        config: {},
        log: async () => {},
        service: {
            stateSet: async (key, value) => { state.set(key, value); },
            stateGet: async (key) => (state.has(key) ? state.get(key) : null),
            stateUnset: async (key) => { state.delete(key); },
            loadState: async () => [...state].map(([key, value]) => ({ key, value }))
        },
        triggerComponent: async (flowId, componentId, payload) => { triggered.push(payload); }
    };
}

describe('RabbitMQ stream consumer', function() {

    afterEach(function() {
        sinon.restore();
        // The registries live on `process`, so they outlive each test.
        [process.RABBITMQ_CONNECTOR_OPEN_CHANNELS, process.RABBITMQ_CONNECTOR_OPEN_CONNECTIONS].forEach((registry) => {
            Object.keys(registry || {}).forEach((key) => delete registry[key]);
        });
    });

    it('subscribes with a per-channel prefetch and the stream arguments', async function() {

        const broker = fakeBroker();
        const context = fakeContext();

        await connections.addConsumer(context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);

        assert.deepStrictEqual(broker.seen.prefetch, [{ count: 100, global: false }]);
        assert.deepStrictEqual(broker.seen.subscriptions[0].options.arguments, {
            'x-stream-offset': 'first',
            'x-stream-filter': 'orders'
        });
    });

    it('stores the offset after the last delivery and resumes there', async function() {

        const broker = fakeBroker({ probeOffset: 8 });
        const context = fakeContext();

        const channelId = await connections.addConsumer(
            context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);
        await broker.deliver(delivery(4, 'orders'), delivery(7, 'orders'));
        await connections.removeChannel(context, channelId);

        // Resubscribing at an offset is inclusive, so the stored offset is the one after the last handled.
        assert.deepStrictEqual(context.state.get(OFFSET_KEY), { offset: 8 });
        assert.strictEqual(context.triggered.length, 2);

        await connections.addConsumer(context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);

        const resumed = broker.seen.subscriptions[broker.seen.subscriptions.length - 1];
        assert.strictEqual(resumed.options.arguments['x-stream-offset'], 8);
        assert.strictEqual(context.triggered.filter((payload) => payload.warning).length, 0);
    });

    it('drops a delivery whose filter value does not match', async function() {

        const broker = fakeBroker();
        const context = fakeContext();

        const channelId = await connections.addConsumer(
            context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);
        await broker.deliver(delivery(5, 'invoices'));
        await connections.removeChannel(context, channelId);

        // The broker's stream filter is a bloom filter: it over-delivers, and the extra deliveries are acked.
        assert.strictEqual(context.triggered.length, 0);
        assert.deepStrictEqual(broker.seen.acked, [5]);
        assert.deepStrictEqual(context.state.get(OFFSET_KEY), { offset: 6 });
    });

    it('never stores an offset past a delivery that is still being enqueued', async function() {

        const broker = fakeBroker();
        const context = fakeContext();
        const enqueuing = new Set();
        const premature = [];
        context.triggerComponent = async (flowId, componentId, payload) => {
            const offset = payload.properties.headers['x-stream-offset'];
            enqueuing.add(offset);
            if (offset === 4) await new Promise((resolve) => setTimeout(resolve, 20));
            enqueuing.delete(offset);
            context.triggered.push(payload);
        };
        const stateSet = context.service.stateSet;
        context.service.stateSet = async (key, value) => {
            const passesEnqueuing = [...enqueuing].some((offset) => offset < value.offset);
            if (key === OFFSET_KEY && passesEnqueuing) premature.push(value.offset);
            await stateSet(key, value);
        };

        const channelId = await connections.addConsumer(
            context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);
        await broker.deliverAtOnce(delivery(4, 'orders'), delivery(5, 'orders'));
        await connections.removeChannel(context, channelId);

        assert.deepStrictEqual(premature, []);
        assert.deepStrictEqual(context.triggered.map((payload) => payload.properties.headers['x-stream-offset']), [4, 5]);
        assert.deepStrictEqual(context.state.get(OFFSET_KEY), { offset: 6 });
    });

    it('closes the consumer at a delivery that could not be enqueued, for the sync job to resume there', async function() {

        const broker = fakeBroker();
        const context = fakeContext();
        context.triggerComponent = async (flowId, componentId, payload) => {
            if (payload.properties.headers['x-stream-offset'] === 5) throw new Error('enqueue failed');
            context.triggered.push(payload);
        };

        const channelId = await connections.addConsumer(
            context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);
        await broker.deliverAtOnce(delivery(4, 'orders'), delivery(5, 'orders'), delivery(6, 'orders'));

        assert.strictEqual(context.triggered.length, 1);
        assert.deepStrictEqual(broker.seen.acked, [4]);
        assert.deepStrictEqual(context.state.get(OFFSET_KEY), { offset: 5 });
        // Closed on this node but still registered, which is what makes the sync job open it again.
        assert.strictEqual(connections.listChannels()[channelId], undefined);
        assert.ok(context.state.has(channelId));
    });

    it('reports retention dropping messages the consumer had not read', async function() {

        const broker = fakeBroker({ probeOffset: 42 });
        const context = fakeContext();
        context.state.set(OFFSET_KEY, { offset: 10 });

        await connections.addConsumer(context, STREAM, streamOptions('first', 'orders'), FLOW, COMPONENT, AUTH);

        assert.deepStrictEqual(context.triggered[0].warning, {
            reason: 'truncated',
            queue: STREAM,
            requestedOffset: 10,
            firstOffset: 42,
            lost: 32
        });
        const subscription = broker.seen.subscriptions[broker.seen.subscriptions.length - 1];
        assert.strictEqual(subscription.options.arguments['x-stream-offset'], 42);
    });

    it('leaves a consumer of a classic queue unchanged', async function() {

        const broker = fakeBroker();
        const context = fakeContext();

        // No prefetch and no arguments: exactly what the component sends when no stream field is filled in.
        const channelId = await connections.addConsumer(
            context, 'orders.queue', { noAck: false, exclusive: false }, FLOW, COMPONENT, AUTH);
        await broker.deliver({ content: Buffer.from('{}'), fields: {}, properties: {} });
        await connections.removeChannel(context, channelId);

        assert.deepStrictEqual(broker.seen.prefetch, []);
        assert.strictEqual(broker.seen.subscriptions[0].options.arguments, undefined);
        assert.strictEqual(context.triggered.length, 1);
        assert.strictEqual(context.state.has(OFFSET_KEY), false);
    });

    it('subscribes NewMessage to a stream with a prefetch and manual acks, and leaves a queue as it was', async function() {

        const NewMessage = require('../../platform/NewMessage/NewMessage');
        const consumerOptions = async (properties) => {
            let sent = null;
            await NewMessage.start({
                componentId: COMPONENT,
                flowId: FLOW,
                auth: AUTH,
                properties,
                callAppmixer: async ({ body }) => { sent = body.options; return { channelId: 'consumer:1' }; },
                stateSet: async () => {}
            });
            return sent;
        };

        const stream = await consumerOptions({ queue: STREAM, noAck: true, streamFilterValue: 'orders' });
        assert.strictEqual(stream.prefetch, 1);
        assert.strictEqual(stream.noAck, false);
        assert.deepStrictEqual(stream.arguments, { 'x-stream-offset': 'next', 'x-stream-filter': 'orders' });

        const numeric = await consumerOptions({ queue: STREAM, streamOffset: '1200', prefetch: 50 });
        assert.strictEqual(numeric.arguments['x-stream-offset'], 1200);
        assert.strictEqual(numeric.prefetch, 50);

        const queue = await consumerOptions({ queue: 'orders.queue', noAck: true });
        assert.strictEqual(queue.prefetch, undefined);
        assert.strictEqual(queue.noAck, true);
        assert.strictEqual(queue.arguments, undefined);
    });

    it('is not undone by the connection sync job, which walks the same plugin state', async function() {

        const context = fakeContext();
        context.state.set(OFFSET_KEY, { offset: 3 });
        let runJob = null;
        context.scheduleJob = async (name, schedule, callback) => { runJob = callback; };
        context.db = { coreCollection: () => ({ findOne: async () => null }) };

        await require('../../jobs')(context);
        await runJob();

        assert.deepStrictEqual(context.state.get(OFFSET_KEY), { offset: 3 });
    });
});
