'use strict';

const assert = require('assert');
const sinon = require('sinon');
const baseX = require('base-x').default;

const registerRoutes = require('../../routes');
const { parseCallerWebhookUrl, CallbackError } = require('../../callerWebhook');

const base62 = baseX('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const encode = url => base62.encode(Buffer.from(url));

const API_URL = 'https://api.appmixer.test';
const WEBHOOK_URL = `${API_URL}/flows/flow-1/components/call-1?enqueueOnly=true`;

function createContext({ flow, userId = 'user-1', appmixerApiUrl = API_URL } = {}) {

    const routes = {};
    const findOne = sinon.stub().resolves(flow === undefined ? {
        flowId: 'flow-1',
        userId: 'user-1',
        flow: { 'call-1': { type: 'appmixer.utils.subflows.CallFlow' } }
    } : flow);
    const context = {
        appmixerApiUrl,
        log: sinon.stub(),
        httpRequest: sinon.stub().resolves({ data: {} }),
        triggerComponent: sinon.stub().resolves(),
        service: { stateSet: sinon.stub(), stateGet: sinon.stub() },
        db: { coreCollection: sinon.stub().returns({ findOne }) },
        http: {
            auth: { getUser: sinon.stub().resolves({ getId: () => userId }) },
            router: { register: route => { routes[`${route.method} ${route.path}`] = route; } }
        }
    };
    registerRoutes(context);
    return { context, routes, findOne };
}

function createH() {

    const h = {
        response(body) {
            const res = { body, statusCode: 200, code(status) { res.statusCode = status; return res; } };
            return res;
        }
    };
    return h;
}

async function callback(routes, payload) {

    return routes['POST /callback'].options.handler({ payload }, createH());
}

describe('utils.subflows routes /callback', () => {

    it('is not public', () => {

        const { routes } = createContext();
        assert.deepStrictEqual(routes['POST /callback'].options.auth.strategies, ['jwt-strategy']);
    });

    it('posts the payload to the CallFlow webhook of this instance', async () => {

        const { context, routes, findOne } = createContext();
        const result = await callback(routes, { correlationId: encode(WEBHOOK_URL), payload: [{ name: 'a', value: 1 }] });

        assert.deepStrictEqual(result, {});
        assert(findOne.calledWith({ flowId: 'flow-1' }));
        sinon.assert.calledOnceWithExactly(context.httpRequest, {
            method: 'POST',
            url: WEBHOOK_URL,
            data: [{ name: 'a', value: 1 }],
            maxRedirects: 0
        });
    });

    it('round-trips the correlationId created by /trigger', async () => {

        const { context, routes } = createContext();
        const { correlationId } = await routes['POST /trigger/{calleeFlowId}/{calleeComponentId}'].options.handler({
            params: { calleeFlowId: 'callee', calleeComponentId: 'on-call' },
            payload: { callerWebhookUrl: WEBHOOK_URL, payload: {} }
        });

        await callback(routes, { correlationId, payload: [] });
        assert.strictEqual(context.httpRequest.firstCall.args[0].url, WEBHOOK_URL);
    });

    [
        ['cloud metadata', 'http://169.254.169.254/latest/meta-data/'],
        ['an internal service', 'http://engine:2200/flows/flow-1/components/call-1'],
        ['another instance', 'https://api.other-tenant.test/flows/flow-1/components/call-1'],
        ['another scheme on the same host', 'http://api.appmixer.test/flows/flow-1/components/call-1'],
        ['another port on the same host', 'https://api.appmixer.test:8443/flows/flow-1/components/call-1'],
        ['credentials in the URL', 'https://user:pass@api.appmixer.test/flows/flow-1/components/call-1'],
        ['a non-webhook path', `${API_URL}/plugins/appmixer/utils/subflows/callback`],
        ['a path traversal', `${API_URL}/flows/flow-1/components/..%2F..%2Fusers`],
        ['not a URL', 'not a url']
    ].forEach(([name, url]) => {

        it(`rejects ${name}`, async () => {

            const { context, routes } = createContext();
            const res = await callback(routes, { correlationId: encode(url), payload: {} });

            assert.strictEqual(res.statusCode, 400);
            sinon.assert.notCalled(context.httpRequest);
        });
    });

    it('rejects a missing or malformed correlationId', async () => {

        const { context, routes } = createContext();
        assert.strictEqual((await callback(routes, { payload: {} })).statusCode, 400);
        assert.strictEqual((await callback(routes, { correlationId: 'not-base62!', payload: {} })).statusCode, 400);
        sinon.assert.notCalled(context.httpRequest);
    });

    it('rejects a flow that does not exist', async () => {

        const { context, routes } = createContext({ flow: null });
        const res = await callback(routes, { correlationId: encode(WEBHOOK_URL), payload: {} });

        assert.strictEqual(res.statusCode, 404);
        sinon.assert.notCalled(context.httpRequest);
    });

    it('rejects a component that is not a CallFlow', async () => {

        const { context, routes } = createContext({
            flow: { flowId: 'flow-1', userId: 'user-1', flow: { 'call-1': { type: 'appmixer.utils.http.Webhook' } } }
        });
        const res = await callback(routes, { correlationId: encode(WEBHOOK_URL), payload: {} });

        assert.strictEqual(res.statusCode, 400);
        sinon.assert.notCalled(context.httpRequest);
    });

    it('rejects the CallFlow webhook of another user', async () => {

        const { context, routes } = createContext({ userId: 'user-2' });
        const res = await callback(routes, { correlationId: encode(WEBHOOK_URL), payload: {} });

        assert.strictEqual(res.statusCode, 403);
        sinon.assert.notCalled(context.httpRequest);
    });
});

describe('utils.subflows parseCallerWebhookUrl', () => {

    it('accepts an API URL with a base path', () => {

        const target = parseCallerWebhookUrl(
            { appmixerApiUrl: 'https://appmixer.test/api/' },
            'https://appmixer.test/api/flows/f%201/components/c1?correlationId=x'
        );
        assert.deepStrictEqual(target, {
            flowId: 'f 1',
            componentId: 'c1',
            url: 'https://appmixer.test/api/flows/f%201/components/c1?correlationId=x'
        });
    });

    it('rejects a URL outside the base path', () => {

        assert.throws(
            () => parseCallerWebhookUrl({ appmixerApiUrl: 'https://appmixer.test/api' },
                'https://appmixer.test/flows/f1/components/c1'),
            CallbackError
        );
    });

    it('fails closed when the API URL is unknown', () => {

        assert.throws(
            () => parseCallerWebhookUrl({}, WEBHOOK_URL),
            err => err instanceof CallbackError && err.statusCode === 500
        );
    });
});
