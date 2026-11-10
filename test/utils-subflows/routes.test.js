'use strict';

const assert = require('assert');
const path = require('path');

const subflowsDir = path.join(__dirname, '../../src/appmixer/utils/subflows');
// base-x is a dependency of the subflows module (src/appmixer/utils/subflows/package.json).
const baseX = require(require.resolve('base-x', { paths: [subflowsDir] })).default;
const base62 = baseX('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const routes = require(path.join(subflowsDir, 'routes.js'));

const API_URL = 'https://api.tenant.appmixer.cloud';
const FLOW_ID = '6f1c1b2e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';
const COMPONENT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const CALLER_URL = `${API_URL}/flows/${FLOW_ID}/components/${COMPONENT_ID}` +
    '?correlationId=0f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a&correlationInPort=in' +
    '&messageId=1a2b3c4d-5e6f-4a8b-9c0d-1e2f3a4b5c6d&enqueueOnly=true';

function createPluginContext(config = {}) {

    const store = new Map();

    class Model {
        static createSettersAndGetters() {}
        populate(data) {
            Object.assign(this, data);
            return this;
        }
        async save() {
            store.set(this.id, { ...this });
            return this;
        }
        static async findOne(query) {
            const record = store.get(query.id);
            return record ? Object.assign(new this(), record) : null;
        }
        static async deleteMany(query) {
            if (query.id) {
                store.delete(query.id);
            }
        }
    }

    const handlers = {};
    const context = {
        config,
        appmixerApiUrl: API_URL,
        db: { Model },
        service: {},
        http: {
            router: {
                register: ({ method, path, options }) => {
                    handlers[`${method} ${path}`] = options.handler;
                }
            }
        },
        triggered: [],
        triggerComponent: async (...args) => {
            context.triggered.push(args);
        },
        requests: [],
        httpRequest: async (req) => {
            context.requests.push(req);
            return { data: {} };
        }
    };
    routes(context);
    return { context, handlers, store };
}

const h = {
    response(body) {
        return {
            code(statusCode) {
                return { statusCode, body };
            }
        };
    }
};

describe('utils.subflows routes', function() {

    let context;
    let handlers;
    let store;

    beforeEach(function() {
        ({ context, handlers, store } = createPluginContext());
    });

    const trigger = () => handlers['POST /trigger/{calleeFlowId}/{calleeComponentId}']({
        params: { calleeFlowId: 'callee-flow', calleeComponentId: 'callee-component' },
        payload: { callerWebhookUrl: CALLER_URL, payload: { a: 1 } }
    });
    const callback = (correlationId) => handlers['POST /callback']({
        payload: { correlationId, payload: [{ name: 'x', value: 1 }] }
    }, h);

    it('legacy base62 correlationId is longer than the 255-char AMQP limit (regression)', function() {

        assert.ok(base62.encode(Buffer.from(CALLER_URL)).length > 255);
    });

    it('/trigger passes a UUID correlationId (<= 255 chars) and stores the caller', async function() {

        const { correlationId } = await trigger();
        assert.match(correlationId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        assert.ok(correlationId.length <= 255);

        assert.strictEqual(context.triggered.length, 1);
        const [flowId, componentId, payload, params] = context.triggered[0];
        assert.strictEqual(flowId, 'callee-flow');
        assert.strictEqual(componentId, 'callee-component');
        assert.deepStrictEqual(payload, { a: 1 });
        assert.deepStrictEqual(params, { enqueueOnly: 'true', correlationId });

        const record = store.get(correlationId);
        assert.strictEqual(record.callerWebhookUrl, CALLER_URL);
        const ttlMs = new Date(record.expiresAt) - new Date(record.createdAt);
        assert.strictEqual(ttlMs, 7 * 24 * 60 * 60 * 1000);
    });

    it('/trigger honours the callTTL config and removes the record when triggering fails', async function() {

        const configured = createPluginContext({ callTTL: '60' });
        const result = await configured.handlers['POST /trigger/{calleeFlowId}/{calleeComponentId}']({
            params: { calleeFlowId: 'f', calleeComponentId: 'c' },
            payload: { callerWebhookUrl: CALLER_URL, payload: {} }
        });
        const record = configured.store.get(result.correlationId);
        assert.strictEqual(new Date(record.expiresAt) - new Date(record.createdAt), 60 * 1000);

        configured.context.triggerComponent = async () => {
            throw new Error('Invalid flow');
        };
        const sizeBefore = configured.store.size;
        await assert.rejects(configured.handlers['POST /trigger/{calleeFlowId}/{calleeComponentId}']({
            params: { calleeFlowId: 'f', calleeComponentId: 'c' },
            payload: { callerWebhookUrl: CALLER_URL, payload: {} }
        }), /Invalid flow/);
        assert.strictEqual(configured.store.size, sizeBefore);
    });

    it('/callback posts the payload to the stored caller URL', async function() {

        const { correlationId } = await trigger();
        const response = await callback(correlationId);
        assert.deepStrictEqual(response, {});
        assert.strictEqual(context.requests.length, 1);
        assert.strictEqual(context.requests[0].method, 'POST');
        assert.strictEqual(context.requests[0].url, CALLER_URL);
        assert.deepStrictEqual(context.requests[0].data, [{ name: 'x', value: 1 }]);
    });

    it('/callback rejects an unknown correlationId with 404', async function() {

        const response = await callback('0f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a');
        assert.strictEqual(response.statusCode, 404);
        assert.strictEqual(context.requests.length, 0);
    });

    it('/callback rejects an expired correlationId with 404', async function() {

        const { correlationId } = await trigger();
        store.get(correlationId).expiresAt = new Date(Date.now() - 1000);
        const response = await callback(correlationId);
        assert.strictEqual(response.statusCode, 404);
        assert.strictEqual(context.requests.length, 0);
    });

    it('/callback rejects a missing correlationId with 400', async function() {

        const response = await callback(undefined);
        assert.strictEqual(response.statusCode, 400);
    });

    it('/callback accepts a legacy base62 correlationId pointing to this tenant', async function() {

        const response = await callback(base62.encode(Buffer.from(CALLER_URL)));
        assert.deepStrictEqual(response, {});
        assert.strictEqual(context.requests.length, 1);
        assert.strictEqual(context.requests[0].url, CALLER_URL);
    });

    it('/callback rejects a legacy correlationId pointing to another host or path', async function() {

        const urls = [
            CALLER_URL.replace(API_URL, 'https://attacker.example.com'),
            CALLER_URL.replace(API_URL, 'http://api.tenant.appmixer.cloud'),
            CALLER_URL.replace(API_URL, 'https://api.tenant.appmixer.cloud.attacker.example.com'),
            CALLER_URL.replace(API_URL, 'https://user:pass@api.tenant.appmixer.cloud'),
            `${API_URL}/plugins/appmixer/utils/subflows/callback`,
            `${API_URL}/flows/not-a-uuid/components/${COMPONENT_ID}`,
            'http://169.254.169.254/latest/meta-data/'
        ];
        for (const url of urls) {
            const response = await callback(base62.encode(Buffer.from(url)));
            assert.strictEqual(response.statusCode, 404, url);
        }
        // Not base62 at all.
        assert.strictEqual((await callback('not base62!')).statusCode, 404);
        assert.strictEqual(context.requests.length, 0);
    });

    it('legacy correlationId is rejected when the tenant API URL is unknown', function() {

        assert.strictEqual(routes.resolveLegacyCallerUrl(base62.encode(Buffer.from(CALLER_URL)), undefined), null);
        assert.strictEqual(routes.resolveLegacyCallerUrl(base62.encode(Buffer.from(CALLER_URL)), API_URL), CALLER_URL);
    });
});
