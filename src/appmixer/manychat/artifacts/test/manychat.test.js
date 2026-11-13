'use strict';

const assert = require('assert');

const auth = require('../../auth');
const lib = require('../../lib');
const createSubscriber = require('../../core/CreateSubscriber/CreateSubscriber');
const updateSubscriber = require('../../core/UpdateSubscriber/UpdateSubscriber');
const getSubscriber = require('../../core/GetSubscriber/GetSubscriber');
const findSubscribers = require('../../core/FindSubscribers/FindSubscribers');
const addTag = require('../../core/AddTagToSubscriber/AddTagToSubscriber');
const setCustomField = require('../../core/SetCustomField/SetCustomField');
const sendContent = require('../../core/SendContent/SendContent');
const sendFlow = require('../../core/SendFlow/SendFlow');
const listTags = require('../../core/ListTags/ListTags');
const listFlows = require('../../core/ListFlows/ListFlows');
const createTag = require('../../core/CreateTag/CreateTag');
const deleteTag = require('../../core/DeleteTag/DeleteTag');
const makeApiCall = require('../../core/MakeApiCall/MakeApiCall');

class CancelError extends Error {}

const SUBSCRIBER = { id: '1234567890', name: 'Jane Doe', email: 'jane@example.com', tags: [], custom_fields: [] };

function contextFor(content, responder, properties = {}) {

    const requests = [];
    const sent = [];
    const cache = new Map();
    return {
        requests,
        sent,
        auth: { apiKey: '123:token' },
        config: {},
        messages: { in: { content } },
        properties,
        CancelError,
        lock: async () => ({ unlock: async () => {} }),
        staticCache: {
            get: async key => cache.get(key),
            set: async (key, value) => cache.set(key, value)
        },
        httpRequest: async (options) => {
            requests.push(options);
            return responder(options);
        },
        sendJson: async (data, port) => {
            sent.push({ data, port });
            return { data, port };
        }
    };
}

const ok = data => ({ status: 200, headers: {}, data: { status: 'success', data } });

describe('manychat connector', function() {

    it('validates the token with GET /fb/page/getInfo and names the account after the page', async function() {

        let request;
        const context = {
            apiKey: '123:token',
            httpRequest: async (options) => {
                request = options;
                return { data: { status: 'success', data: { id: 106, name: 'Acme Shop' } } };
            }
        };

        assert.strictEqual(await auth.definition.validate(context), true);
        assert.strictEqual(request.url, 'https://api.manychat.com/fb/page/getInfo');
        assert.strictEqual(request.headers.Authorization, 'Bearer 123:token');
        assert.deepStrictEqual(await auth.definition.requestProfileInfo(context), { id: 106, name: 'Acme Shop' });
    });

    it('reports a 401 as an invalid token and keeps other errors', async function() {

        const err401 = Object.assign(new Error('401'), { response: { status: 401 } });
        await assert.rejects(
            auth.definition.validate({ apiKey: 'x', httpRequest: async () => { throw err401; } }),
            /Invalid Manychat API token/
        );
        const err500 = Object.assign(new Error('boom'), { response: { status: 500 } });
        await assert.rejects(
            auth.definition.validate({ apiKey: 'x', httpRequest: async () => { throw err500; } }),
            /boom/
        );
    });

    it('puts the Manychat error details on a failed request', async function() {

        const context = contextFor({}, async () => {
            const err = new Error('Request failed with status code 400');
            err.response = {
                status: 400,
                data: { status: 'error', message: 'Validation error', details: { messages: { email: ['Email is invalid'] } } }
            };
            throw err;
        });
        await assert.rejects(
            lib.request(context, { path: '/fb/page/getTags' }),
            /Manychat: Validation error; Email is invalid/
        );
    });

    it('treats a 200 answer without status success as an error', async function() {

        const context = contextFor({}, async () => ({ data: { status: 'error', message: 'Permission denied', code: 3011 } }));
        await assert.rejects(lib.request(context, { path: '/fb/page/getTags' }), /Permission denied \(code 3011\)/);
    });

    it('sends numeric IDs as numbers and rejects non-numeric IDs', function() {

        const context = { CancelError };
        assert.strictEqual(lib.toApiId(context, '1234567890', 'ID'), 1234567890);
        assert.strictEqual(lib.toApiId(context, 42, 'ID'), 42);
        assert.strictEqual(lib.toApiId(context, '99999999999999999999', 'ID'), '99999999999999999999');
        assert.throws(() => lib.toApiId(context, 'abc', 'Subscriber ID'), CancelError);
    });

    it('creates a subscriber and sends opt-ins only with their email or phone', async function() {

        const context = contextFor({ firstName: 'Jane', email: 'jane@example.com', hasOptInEmail: true, hasOptInSms: true },
            async () => ok(SUBSCRIBER));
        await createSubscriber.receive(context);

        assert.strictEqual(context.requests[0].method, 'POST');
        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/subscriber/createSubscriber');
        assert.deepStrictEqual(context.requests[0].data, { first_name: 'Jane', email: 'jane@example.com', has_opt_in_email: true });
        assert.deepStrictEqual(context.sent[0], { data: SUBSCRIBER, port: 'out' });
    });

    it('refuses to create a subscriber without email, phone or WhatsApp phone', async function() {

        const context = contextFor({ firstName: 'Jane' }, async () => ok(SUBSCRIBER));
        await assert.rejects(createSubscriber.receive(context), CancelError);
        assert.strictEqual(context.requests.length, 0);
    });

    it('updates a subscriber and returns an empty object', async function() {

        const context = contextFor({ subscriberId: '1234567890', lastName: 'Smith' }, async () => ok(SUBSCRIBER));
        await updateSubscriber.receive(context);

        assert.deepStrictEqual(context.requests[0].data, { subscriber_id: 1234567890, last_name: 'Smith' });
        assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
    });

    it('gets a subscriber by ID', async function() {

        const context = contextFor({ subscriberId: '1234567890' }, async () => ok(SUBSCRIBER));
        await getSubscriber.receive(context);

        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/subscriber/getInfo');
        assert.deepStrictEqual(context.requests[0].params, { subscriber_id: 1234567890 });
        assert.strictEqual(context.sent[0].data.id, '1234567890');
    });

    it('finds subscribers by email, name and custom field', async function() {

        let context = contextFor({ searchBy: 'email', searchValue: 'jane@example.com', outputType: 'first' }, async () => ok(SUBSCRIBER));
        await findSubscribers.receive(context);
        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/subscriber/findBySystemField');
        assert.deepStrictEqual(context.requests[0].params, { email: 'jane@example.com' });
        assert.strictEqual(context.sent[0].data.id, '1234567890');

        context = contextFor({ searchBy: 'name', searchValue: 'Jane Doe', outputType: 'array' }, async () => ok([SUBSCRIBER, SUBSCRIBER]));
        await findSubscribers.receive(context);
        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/subscriber/findByName');
        assert.strictEqual(context.sent[0].data.count, 2);

        context = contextFor({ searchBy: 'customField', searchValue: 'blue', fieldId: '11', outputType: 'array' }, async () => ok([SUBSCRIBER]));
        await findSubscribers.receive(context);
        assert.deepStrictEqual(context.requests[0].params, { field_id: 11, field_value: 'blue' });
    });

    it('sends to notFound when nobody matches', async function() {

        const context = contextFor({ searchBy: 'phone', searchValue: '+15550100', outputType: 'array' }, async () => ok([]));
        await findSubscribers.receive(context);
        assert.deepStrictEqual(context.sent[0], { data: {}, port: 'notFound' });
    });

    it('requires a custom field when searching by custom field', async function() {

        const context = contextFor({ searchBy: 'customField', searchValue: 'blue' }, async () => ok([]));
        await assert.rejects(findSubscribers.receive(context), CancelError);
        assert.strictEqual(context.requests.length, 0);
    });

    it('adds a tag with numeric IDs', async function() {

        const context = contextFor({ subscriberId: '1234567890', tagId: '98765' }, async () => ok(undefined));
        await addTag.receive(context);
        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/subscriber/addTag');
        assert.deepStrictEqual(context.requests[0].data, { subscriber_id: 1234567890, tag_id: 98765 });
        assert.deepStrictEqual(context.sent[0].data, { subscriberId: '1234567890', tagId: '98765' });
    });

    it('converts a custom field value to the field type', async function() {

        const fields = [{ id: 1, name: 'Age', type: 'number' }, { id: 2, name: 'VIP', type: 'boolean' }, { id: 3, name: 'Color', type: 'text' }];
        const responder = async (options) => options.url.endsWith('/getCustomFields') ? ok(fields) : ok(undefined);

        let context = contextFor({ subscriberId: '5', fieldId: '1', fieldValue: '42' }, responder);
        await setCustomField.receive(context);
        assert.deepStrictEqual(context.requests[1].data, { subscriber_id: 5, field_id: 1, field_value: 42 });

        context = contextFor({ subscriberId: '5', fieldId: '2', fieldValue: 'TRUE' }, responder);
        await setCustomField.receive(context);
        assert.strictEqual(context.requests[1].data.field_value, true);

        context = contextFor({ subscriberId: '5', fieldId: '3', fieldValue: '42' }, responder);
        await setCustomField.receive(context);
        assert.strictEqual(context.requests[1].data.field_value, '42');

        context = contextFor({ subscriberId: '5', fieldId: '1', fieldValue: 'abc' }, responder);
        await assert.rejects(setCustomField.receive(context), CancelError);
        assert.strictEqual(context.requests.length, 1);
    });

    it('builds the Dynamic Block payload for text and media', async function() {

        const context = contextFor({
            subscriberId: '5', channel: 'instagram', contentType: 'image', mediaUrl: 'https://example.com/a.png', messageTag: ''
        }, async () => ok(undefined));
        await sendContent.receive(context);
        assert.deepStrictEqual(context.requests[0].data, {
            subscriber_id: 5,
            data: { version: 'v2', content: { type: 'instagram', messages: [{ type: 'image', url: 'https://example.com/a.png' }], actions: [], quick_replies: [] } }
        });

        const messenger = sendContent.buildData({ CancelError }, { channel: 'facebook', contentType: 'text', text: 'Hi' });
        assert.strictEqual(messenger.content.type, undefined);
        assert.throws(() => sendContent.buildData({ CancelError }, { contentType: 'text' }), CancelError);
        assert.throws(() => sendContent.buildData({ CancelError }, { contentType: 'video' }), CancelError);
    });

    it('sends a flow', async function() {

        const context = contextFor({ subscriberId: '5', flowNs: ' content2026_1 ' }, async () => ok(undefined));
        await sendFlow.receive(context);
        assert.deepStrictEqual(context.requests[0].data, { subscriber_id: 5, flow_ns: 'content2026_1' });
    });

    it('lists tags and flows, and maps them to dropdown options', async function() {

        let context = contextFor({ outputType: 'array' }, async () => ok([{ id: 1, name: 'VIP' }]));
        await listTags.receive(context);
        assert.deepStrictEqual(context.sent[0].data, { result: [{ id: 1, name: 'VIP' }], count: 1 });
        assert.deepStrictEqual(listTags.toSelectArray(context.sent[0].data), [{ label: 'VIP', value: '1' }]);

        context = contextFor({ outputType: 'array' }, async () => ok({ flows: [{ ns: 'c1', name: 'Welcome', folder_id: 0 }], folders: [] }));
        await listFlows.receive(context);
        assert.deepStrictEqual(listFlows.toSelectArray(context.sent[0].data), [{ label: 'Welcome', value: 'c1' }]);
    });

    it('returns an empty list instead of an error to an inspector dropdown', async function() {

        const context = contextFor({ outputType: 'array' }, async () => { throw new Error('down'); }, { isSource: true });
        await listTags.receive(context);
        assert.deepStrictEqual(context.sent[0].data, { result: [], count: 0 });
    });

    it('creates and deletes a tag', async function() {

        let context = contextFor({ name: 'VIP' }, async () => ok({ tag: { id: 7, name: 'VIP' } }));
        await createTag.receive(context);
        assert.deepStrictEqual(context.sent[0].data, { id: 7, name: 'VIP' });

        context = contextFor({ tagId: '7' }, async () => ok(undefined));
        await deleteTag.receive(context);
        assert.strictEqual(context.requests[0].url, 'https://api.manychat.com/fb/page/removeTag');
        assert.deepStrictEqual(context.requests[0].data, { tag_id: 7 });
        assert.deepStrictEqual(context.sent[0].data, {});
    });

    it('pins MakeApiCall to the Manychat API origin', async function() {

        for (const url of ['https://evil.example/x', '//evil.example/x', 'https://user:pw@api.manychat.com/x']) {
            const context = contextFor({ url, method: 'GET' }, async () => ok({}));
            await assert.rejects(makeApiCall.receive(context), CancelError);
            assert.strictEqual(context.requests.length, 0);
        }
    });

    it('passes Designer key-value headers and parameters in MakeApiCall', async function() {

        const context = contextFor({
            url: '/fb/subscriber/getInfo',
            method: 'GET',
            parameters: '{"subscriber_id":"5"}',
            headers: '{"Accept":"application/json","authorization":"Bearer other"}'
        }, async () => ok({ id: '5' }));
        await makeApiCall.receive(context);

        const request = context.requests[0];
        assert.strictEqual(request.url, 'https://api.manychat.com/fb/subscriber/getInfo');
        assert.deepStrictEqual(request.params, { subscriber_id: '5' });
        assert.strictEqual(request.headers.Accept, 'application/json');
        assert.strictEqual(request.headers.authorization, undefined);
        assert.strictEqual(request.headers.Authorization, 'Bearer 123:token');
        assert.strictEqual(context.sent[0].data.statusCode, 200);
    });
});
