/* eslint-disable no-underscore-dangle */
'use strict';

const assert = require('assert');
const crypto = require('crypto');

const lib = require('../../lib');
const auth = require('../../auth');
const CreateObject = require('../../core/CreateObject/CreateObject');
const UpdateObject = require('../../core/UpdateObject/UpdateObject');
const FindObjects = require('../../core/FindObjects/FindObjects');
const FindRelatedObjects = require('../../core/FindRelatedObjects/FindRelatedObjects');
const FindObjectsByQuery = require('../../core/FindObjectsByQuery/FindObjectsByQuery');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const UploadFile = require('../../core/UploadFile/UploadFile');
const NewObject = require('../../core/NewObject/NewObject');
const UpdatedObject = require('../../core/UpdatedObject/UpdatedObject');
const DeletedObject = require('../../core/DeletedObject/DeletedObject');

class CancelError extends Error {}

const SERVER_URL = 'https://acme.lime-crm.com/acme';

const LIMETYPE = {
    name: 'company',
    localname: { singular: 'Company', plural: 'Companies' },
    _embedded: {
        properties: [
            { name: 'name', type: 'string', localname: 'Company name', required: true },
            { name: 'buyingstatus', type: 'option', localname: 'Buying status', options: [
                { key: 'prospect', localname: 'Prospect' }, { key: 'active', text: 'Active' }
            ] },
            { name: 'employees', type: 'integer', localname: 'Employees' },
            { name: 'inactive', type: 'yesno', localname: 'Inactive' },
            { name: 'coworker', type: 'belongsto', localname: 'Responsible' },
            { name: 'person', type: 'hasmany', localname: 'Persons' },
            { name: '_timestamp', type: 'time', localname: 'Updated' }
        ]
    }
};

function createContext({
    input = {},
    properties = {},
    state = {},
    webhook,
    responder = () => ({}),
    serverUrl = SERVER_URL
} = {}) {

    const cache = {};
    const context = {
        auth: { serverUrl, apiKey: 'test-key' },
        config: {},
        componentId: 'component-1',
        properties,
        messages: webhook ? { webhook: { content: webhook } } : { in: { content: input } },
        CancelError,
        requests: [],
        sent: [],
        responses: [],
        state: { ...state },
        async httpRequest(options) {
            context.requests.push(options);
            const result = await responder(options);
            if (result && result.__error) {
                const err = new Error('HTTP ' + result.__error);
                err.response = { status: result.__error, data: { error: 'failed' } };
                throw err;
            }
            return { status: 200, headers: { 'content-type': 'application/hal+json' }, data: result };
        },
        async sendJson(data, port) {
            context.sent.push({ data, port });
        },
        async saveState(newState) {
            context.state = newState;
        },
        async loadState() {
            return context.state;
        },
        async log() {},
        async lock() {
            return { unlock() {} };
        },
        staticCache: {
            async get(key) { return cache[key]; },
            async set(key, value) { cache[key] = value; }
        },
        getWebhookUrl() {
            return 'https://api.appmixer.example.com/flows/1/components/2';
        },
        response(body, status) {
            context.responses.push({ body, status });
            return 'ack';
        }
    };
    return context;
}

function sign(secret, raw) {

    return 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

function signV2(secret, deliveryId, timestamp, raw) {

    const bodyHash = crypto.createHash('sha256').update(raw).digest('hex');
    const signed = 'v2:' + deliveryId + ':' + timestamp + ':' + bodyHash;
    return 'v2=' + crypto.createHmac('sha256', secret).update(signed).digest('hex');
}

describe('limecrm', () => {

    describe('lib.applicationUrl', () => {

        it('keeps the application path and drops a trailing slash and /api/v1', () => {
            assert.strictEqual(lib.applicationUrl('https://acme.lime-crm.com/acme/').base, 'https://acme.lime-crm.com/acme');
            assert.strictEqual(lib.applicationUrl('https://acme.lime-crm.com/acme/api/v1/').base, 'https://acme.lime-crm.com/acme');
            assert.strictEqual(lib.applicationUrl('https://crm.example.com/Lime CRM').base, 'https://crm.example.com/Lime%20CRM');
        });

        it('refuses URLs that would send the key elsewhere or in clear text', () => {
            assert.throws(() => lib.applicationUrl('http://acme.lime-crm.com/acme'), /https/);
            assert.throws(() => lib.applicationUrl('https://user:pw@acme.lime-crm.com/acme'), /user name/);
            assert.throws(() => lib.applicationUrl('https://evil.example/x?https://acme.lime-crm.com/acme'), /query/);
            assert.throws(() => lib.applicationUrl('evil.example'), /not a valid URL/);
        });

        it('makes no request at all when the account URL is invalid', async () => {
            const context = createContext({ serverUrl: 'http://evil.example/acme', input: { objectId: 1 }, properties: { limetype: 'company' } });
            await assert.rejects(() => require('../../core/GetObject/GetObject').receive(context), /https/);
            assert.strictEqual(context.requests.length, 0);

            const authRequests = [];
            await assert.rejects(() => auth.definition.validate({
                serverUrl: 'https://evil.example/x?y', apiKey: 'k',
                httpRequest: async (o) => authRequests.push(o)
            }), /query/);
            assert.strictEqual(authRequests.length, 0);
        });

        it('validates the account with GET /api/v1/limetype/ and the x-api-key header', async () => {
            const requests = [];
            await auth.definition.validate({
                serverUrl: SERVER_URL, apiKey: 'k',
                httpRequest: async (o) => {
                    requests.push(o);
                    return { data: [] };
                }
            });
            assert.strictEqual(requests[0].url, 'https://acme.lime-crm.com/acme/api/v1/limetype/');
            assert.strictEqual(requests[0].headers['x-api-key'], 'k');
            const profile = await auth.definition.requestProfileInfo({ serverUrl: SERVER_URL + '/' });
            assert.deepStrictEqual(profile, { application: 'acme.lime-crm.com/acme' });
        });
    });

    describe('lib.resolveApiUrl', () => {

        const context = createContext();

        it('resolves paths below /api/v1 and below the application', () => {
            assert.strictEqual(lib.resolveApiUrl(context, '/limetype/'), 'https://acme.lime-crm.com/acme/api/v1/limetype/');
            assert.strictEqual(lib.resolveApiUrl(context, 'limeobject/company/'), 'https://acme.lime-crm.com/acme/api/v1/limeobject/company/');
            assert.strictEqual(lib.resolveApiUrl(context, '/api/v2/subscription/'), 'https://acme.lime-crm.com/acme/api/v2/subscription/');
            assert.strictEqual(
                lib.resolveApiUrl(context, 'https://acme.lime-crm.com/acme/api/v1/file/1/'),
                'https://acme.lime-crm.com/acme/api/v1/file/1/'
            );
        });

        it('refuses other hosts, other applications and protocol-relative input', () => {
            assert.throws(() => lib.resolveApiUrl(context, 'https://evil.example/acme/api/v1/'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, '//evil.example/x'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'https://acme.lime-crm.com/other/api/v1/'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, '/../../other/api/v1/limetype/'), CancelError);
            assert.throws(() => lib.resolveApiUrl(context, 'https://x:y@acme.lime-crm.com/acme/api/v1/'), CancelError);
        });
    });

    describe('MakeApiCall', () => {

        it('sends the key-value headers and query parameters the Designer stores as JSON strings', async () => {
            const context = createContext({
                input: {
                    url: '/limeobject/company/',
                    method: 'GET',
                    headers: '{"Accept-Language":"sv"}',
                    parameters: '{"_limit":"5","city":"Lund"}'
                },
                responder: () => ({ _embedded: { limeobjects: [] } })
            });
            await MakeApiCall.receive(context);
            const [req] = context.requests;
            assert.strictEqual(req.url, 'https://acme.lime-crm.com/acme/api/v1/limeobject/company/?_limit=5&city=Lund');
            assert.strictEqual(req.headers['Accept-Language'], 'sv');
            assert.strictEqual(req.headers['x-api-key'], 'test-key');
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });

        it('does not send the key to a foreign host', async () => {
            const context = createContext({ input: { url: 'https://evil.example/steal', method: 'GET' } });
            await assert.rejects(() => MakeApiCall.receive(context), CancelError);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('collections and limetypes', () => {

        it('reads items from HAL, arrays and the Query API', () => {
            assert.deepStrictEqual(lib.extractItems({ _embedded: { limeobjects: [{ id: 1 }] } }), [{ id: 1 }]);
            assert.deepStrictEqual(lib.extractItems({ _embedded: { items: [{ id: 2 }] } }), [{ id: 2 }]);
            assert.deepStrictEqual(lib.extractItems([{ id: 3 }]), [{ id: 3 }]);
            assert.deepStrictEqual(lib.extractItems({ objects: [{ id: 4 }] }), [{ id: 4 }]);
            assert.deepStrictEqual(lib.extractItems({ id: 5, name: 'x' }), []);
            assert.ok(lib.isSingleObject({ id: 5, name: 'x', _links: {} }));
        });

        it('normalizes property definitions from an array or a map', () => {
            const fromArray = lib.normalizeProperties(LIMETYPE);
            const fromMap = lib.normalizeProperties({ properties: { name: { type: 'string', localname: { singular: 'Name' } } } });
            assert.strictEqual(fromArray.find(p => p.name === 'buyingstatus').options[0].text, 'Prospect');
            assert.ok(fromArray.find(p => p.name === 'person').readonly);
            assert.ok(fromArray.find(p => p.name === '_timestamp').readonly);
            assert.deepStrictEqual(fromMap.map(p => [p.name, p.label]), [['name', 'Name']]);
        });

        it('generates inspector inputs for writable properties only', () => {
            const { inputs, schema } = lib.toInspector(lib.normalizeProperties(LIMETYPE), {
                schema: { properties: { values: { type: 'string' } }, required: [] },
                inputs: { values: { type: 'textarea', index: 1 } },
                groups: {}
            });
            assert.deepStrictEqual(Object.keys(inputs), ['values', 'name', 'buyingstatus', 'employees', 'inactive', 'coworker']);
            assert.strictEqual(inputs.buyingstatus.type, 'select');
            assert.deepStrictEqual(inputs.buyingstatus.options[1], { label: 'Active', value: 'active' });
            assert.strictEqual(schema.properties.employees.type, 'integer');
            assert.strictEqual(inputs.coworker.type, 'number');
        });

        it('builds output variables with dot-prefixed titles for option properties', () => {
            const props = lib.objectSchemaProperties(lib.normalizeProperties(LIMETYPE));
            assert.strictEqual(props.buyingstatus.properties.key.title, 'Buying status.Key');
            assert.strictEqual(props.person, undefined);
            assert.strictEqual(props.id.type, 'integer');
        });
    });

    describe('CreateObject / UpdateObject', () => {

        const responder = (options) => {
            if (options.url.includes('/limetype/company/')) return LIMETYPE;
            if (options.method === 'POST') return { id: 1001, ...options.data, _links: { self: {} } };
            if (options.method === 'PUT') return { id: 1001, ...options.data };
            return {};
        };

        it('merges Values (JSON) with typed property inputs and posts them', async () => {
            const context = createContext({
                properties: { limetype: 'company' },
                input: { values: '{"phone": "+46 46 123 456", "name": "From JSON"}', name: 'Acme', employees: '12', inactive: 'false' },
                responder
            });
            await CreateObject.receive(context);
            const post = context.requests.find(r => r.method === 'POST');
            assert.strictEqual(post.url, 'https://acme.lime-crm.com/acme/api/v1/limeobject/company/');
            assert.deepStrictEqual(post.data, { phone: '+46 46 123 456', name: 'Acme', employees: 12, inactive: false });
            assert.strictEqual(context.sent[0].data.id, 1001);
            assert.strictEqual(context.sent[0].data._links, undefined);
        });

        it('updates only the filled properties and returns an empty object', async () => {
            const context = createContext({
                properties: { limetype: 'company' },
                input: { objectId: 1001, values: '{"coworker": null}', name: '', buyingstatus: 'active' },
                responder
            });
            await UpdateObject.receive(context);
            const put = context.requests.find(r => r.method === 'PUT');
            assert.strictEqual(put.url, 'https://acme.lime-crm.com/acme/api/v1/limeobject/company/1001/');
            assert.deepStrictEqual(put.data, { coworker: null, buyingstatus: 'active' });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('refuses a limetype that is not a plain name', async () => {
            const context = createContext({ properties: { limetype: '../file' }, input: { name: 'x' }, responder });
            await assert.rejects(() => CreateObject.receive(context), CancelError);
            assert.strictEqual(context.requests.filter(r => r.method === 'POST').length, 0);
        });
    });

    describe('Find components', () => {

        it('FindObjects sends filters with prefixes, the sort and the maximum page size', async () => {
            const context = createContext({
                properties: { limetype: 'company' },
                input: { filters: '{"city":"Lund","not-buyingstatus":"inactive"}', sort: '-name', outputType: 'array' },
                responder: () => ({ _embedded: { limeobjects: [{ id: 1, name: 'A', _links: {} }] } })
            });
            await FindObjects.receive(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.searchParams.get('city'), 'Lund');
            assert.strictEqual(url.searchParams.get('not-buyingstatus'), 'inactive');
            assert.strictEqual(url.searchParams.get('_sort'), '-name');
            assert.strictEqual(url.searchParams.get('_limit'), '50');
            assert.deepStrictEqual(context.sent[0], { data: { result: [{ id: 1, name: 'A' }], count: 1 }, port: 'out' });
        });

        it('FindObjects sends notFound when nothing matches and refuses reserved filter names', async () => {
            const empty = createContext({ properties: { limetype: 'company' }, input: { outputType: 'first' }, responder: () => ({ _embedded: { limeobjects: [] } }) });
            await FindObjects.receive(empty);
            assert.strictEqual(empty.sent[0].port, 'notFound');

            const reserved = createContext({ properties: { limetype: 'company' }, input: { filters: '{"_limit":"500"}' } });
            await assert.rejects(() => FindObjects.receive(reserved), CancelError);
        });

        it('FindObjectsByQuery sends the query as q and reads objects', async () => {
            const query = { limetype: 'company', responseFormat: { object: { _id: '', name: '' } }, limit: 10 };
            const context = createContext({
                input: { query: JSON.stringify(query), outputType: 'first' },
                responder: () => ({ objects: [{ _id: 7, name: 'Acme' }] })
            });
            await FindObjectsByQuery.receive(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.pathname, '/acme/api/v1/query/');
            assert.deepStrictEqual(JSON.parse(url.searchParams.get('q')), query);
            assert.deepStrictEqual(context.sent[0].data, { _id: 7, name: 'Acme', id: 7, index: 0, count: 1 });
        });

        it('FindRelatedObjects wraps a single related object and reports an unset relation as notFound', async () => {
            const single = createContext({
                input: { limetype: 'person', objectId: 3, relation: 'company', outputType: 'array' },
                responder: () => ({ id: 9, name: 'Acme' })
            });
            await FindRelatedObjects.receive(single);
            assert.strictEqual(single.requests[0].url, 'https://acme.lime-crm.com/acme/api/v1/limeobject/person/3/company/?_limit=50');
            assert.deepStrictEqual(single.sent[0].data, { result: [{ id: 9, name: 'Acme' }], count: 1 });

            const unset = createContext({
                input: { limetype: 'person', objectId: 3, relation: 'company', outputType: 'array' },
                responder: (o) => (o.url.includes('/company/') ? { __error: 404 } : { id: 3 })
            });
            await FindRelatedObjects.receive(unset);
            assert.strictEqual(unset.sent[0].port, 'notFound');
        });
    });

    describe('UploadFile', () => {

        it('sends the raw file with the Content-Disposition the File API expects', async () => {
            const context = createContext({
                input: { fileId: 'f1' },
                responder: () => ({ id: 55, filename: 'offer.pdf', _links: {} })
            });
            context.getFileInfo = async () => ({ filename: 'offer.pdf', contentType: 'application/pdf', length: 3 });
            context.loadFile = async () => Buffer.from('abc');
            await UploadFile.receive(context);
            const [req] = context.requests;
            assert.strictEqual(req.method, 'POST');
            assert.strictEqual(req.url, 'https://acme.lime-crm.com/acme/api/v1/file/');
            assert.strictEqual(req.headers['Content-Disposition'], 'inline; filename=offer.pdf');
            assert.strictEqual(req.data.toString(), 'abc');
            assert.deepStrictEqual(context.sent[0].data, { id: 55, filename: 'offer.pdf' });
            assert.strictEqual(UploadFile.contentDisposition('Offert å.pdf'),
                'inline; filename="Offert _.pdf"; filename*=UTF-8\'\'Offert%20%C3%A5.pdf');
        });
    });

    describe('webhook signatures', () => {

        const secret = 'top-secret';
        const payload = { event: 'company.new', body: { id: 1004, limetype: 'company', values: { name: 'Åkesson AB', value: 1.5 } } };

        it('accepts a v1 signature over the raw body', () => {
            const raw = JSON.stringify(payload);
            assert.ok(lib.verifySignature(secret, { headers: { 'x-lime-signature': sign(secret, raw) }, rawBody: raw, data: payload }));
            assert.ok(!lib.verifySignature('other', { headers: { 'x-lime-signature': sign(secret, raw) }, rawBody: raw, data: payload }));
        });

        it('reproduces the bytes of a Python-serialized body when no raw body is available', () => {
            const pythonRaw = '{"event": "company.new", "body": {"id": 1004, "limetype": "company", '
                + '"values": {"name": "\\u00c5kesson AB", "value": 1.5}}}';
            assert.strictEqual(lib.pythonJson(payload), pythonRaw);
            assert.ok(lib.verifySignature(secret, { headers: { 'X-Lime-Signature': sign(secret, pythonRaw) }, data: payload }));
        });

        it('checks v2 signatures and refuses stale timestamps', () => {
            const raw = JSON.stringify(payload);
            const now = 1795000000;
            const headers = {
                'x-lime-delivery-id': 'd-1',
                'x-lime-delivery-timestamp': String(now - 10),
                'x-lime-signature': signV2(secret, 'd-1', now - 10, raw)
            };
            assert.ok(lib.verifySignature(secret, { headers, rawBody: raw }, now));
            assert.ok(!lib.verifySignature(secret, { headers, rawBody: raw }, now + 400));
            assert.ok(!lib.verifySignature(secret, { headers: { ...headers, 'x-lime-delivery-id': 'd-2' }, rawBody: raw }, now));
        });
    });

    describe('webhook triggers', () => {

        it('registers a v2 subscription and falls back to v1 when the server has none', async () => {
            const context = createContext({
                properties: { limetype: 'company' },
                responder: (o) => (o.url.includes('/api/v2/') ? { __error: 404 } : { id: 12 })
            });
            await NewObject.start(context);
            const v1 = context.requests[1];
            assert.strictEqual(v1.url, 'https://acme.lime-crm.com/acme/api/v1/subscription/');
            assert.deepStrictEqual(v1.data.events, ['company.new']);
            assert.strictEqual(v1.data.target_url, 'https://api.appmixer.example.com/flows/1/components/2');
            assert.ok(v1.data.secret.length >= 32);
            assert.strictEqual(context.state.subscriptionId, '12');
            assert.strictEqual(context.state.apiVersion, 'v1');

            await NewObject.stop(context);
            const del = context.requests[2];
            assert.strictEqual(del.method, 'DELETE');
            assert.strictEqual(del.url, 'https://acme.lime-crm.com/acme/api/v1/subscription/12');
        });

        const state = { subscriptionId: '12', apiVersion: 'v1', secret: 's3cret', eventName: 'company.new' };

        function delivery(body, { secret = state.secret, deliveryId = 'del-1', webhookId = '12' } = {}) {
            const raw = JSON.stringify(body);
            return {
                headers: {
                    'x-lime-webhook-id': webhookId,
                    'x-lime-delivery-id': deliveryId,
                    'x-lime-signature': sign(secret, raw)
                },
                rawBody: raw,
                data: body
            };
        }

        it('reads the new object through the API and ignores a repeated delivery', async () => {
            const body = { event: 'company.new', body: { id: 1004, limetype: 'company', values: {} } };
            const context = createContext({
                properties: { limetype: 'company' },
                state,
                webhook: delivery(body),
                responder: () => ({ id: 1004, name: 'Acme', _links: {} })
            });
            await NewObject.receive(context);
            assert.strictEqual(context.requests[0].url, 'https://acme.lime-crm.com/acme/api/v1/limeobject/company/1004/');
            assert.deepStrictEqual(context.sent, [{ data: { id: 1004, name: 'Acme' }, port: 'out' }]);

            await NewObject.receive(context);
            assert.strictEqual(context.sent.length, 1);
        });

        it('rejects a delivery with a wrong signature without calling the API', async () => {
            const body = { event: 'company.new', body: { id: 1004 } };
            const context = createContext({ properties: { limetype: 'company' }, state, webhook: delivery(body, { secret: 'forged' }) });
            await NewObject.receive(context);
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.responses[0].status, 401);
        });

        it('adds the original values to an updated object', async () => {
            const body = { event: 'company.update', body: { id: 1004, original_values: { phone: '1' }, values: {} } };
            const context = createContext({
                properties: { limetype: 'company' },
                state: { ...state, eventName: 'company.update' },
                webhook: delivery(body),
                responder: () => ({ id: 1004, phone: '2' })
            });
            await UpdatedObject.receive(context);
            assert.deepStrictEqual(context.sent[0].data, { id: 1004, phone: '2', originalValues: { phone: '1' } });
        });

        it('emits the values of a deleted object from the payload', async () => {
            const body = { event: 'company.delete', body: { id: 1004, limetype: 'company', values: { name: 'Acme' } } };
            const context = createContext({
                properties: { limetype: 'company' },
                state: { ...state, eventName: 'company.delete' },
                webhook: delivery(body)
            });
            await DeletedObject.receive(context);
            assert.deepStrictEqual(context.sent[0].data, { id: 1004, limetype: 'company', values: { name: 'Acme' } });
            await assert.rejects(() => DeletedObject.test(context), CancelError);
        });

        it('test() emits the newest object without touching state', async () => {
            const context = createContext({
                properties: { limetype: 'company' },
                responder: () => ({ _embedded: { limeobjects: [{ id: 2000, name: 'Newest' }] } })
            });
            await NewObject.test(context);
            const url = new URL(context.requests[0].url);
            assert.strictEqual(url.searchParams.get('_sort'), '-id');
            assert.strictEqual(url.searchParams.get('_limit'), '1');
            assert.deepStrictEqual(context.sent[0].data, { id: 2000, name: 'Newest' });
            assert.deepStrictEqual(context.state, {});
        });
    });
});
