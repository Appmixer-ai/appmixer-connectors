'use strict';

const assert = require('assert');
const lib = require('../../lib');
const MakeApiCall = require('../../MakeApiCall/MakeApiCall');
const NewRecord = require('../../NewRecord/NewRecord');
const DeletedRecord = require('../../DeletedRecord/DeletedRecord');
const NewRecordPolling = require('../../NewRecordPolling/NewRecordPolling');

class CancelError extends Error {}

// Context of an EU account. httpRequest answers from \`answer(options)\` and records the requests.
function mockContext({ answer = () => ({ data: {} }), properties = {}, state = {}, webhook, content = {} } = {}) {

    const requests = [];
    const sent = [];
    const responses = [];
    const cache = new Map();
    let savedState = state;
    const context = {
        auth: { accessToken: 'token' },
        profileInfo: { id: 'user-1', region: 'eu', apiDomain: 'https://www.zohoapis.eu' },
        properties,
        state,
        config: {},
        componentId: 'component-1',
        CancelError,
        messages: webhook ? { webhook: { content: { data: webhook } } } : { in: { content } },
        httpRequest: async options => {
            requests.push(options);
            return answer(options);
        },
        sendJson: async (data, port) => sent.push({ data, port }),
        response: async (body, status = 200) => responses.push({ body, status }),
        loadState: async () => savedState,
        saveState: async value => {
            savedState = value;
        },
        lock: async () => ({ unlock: async () => {} }),
        staticCache: { get: async key => cache.get(key), set: async (key, value) => cache.set(key, value) },
        log: async () => {},
        getWebhookUrl: () => 'https://appmixer.example.com/webhook'
    };
    return { context, requests, sent, responses, getState: () => savedState };
}

const FIELDS = { data: { fields: [{ api_name: 'Last_Name' }, { api_name: 'Created_Time' }, { api_name: 'Email' }] } };

describe('Bigin', () => {

    describe('MakeApiCall', () => {

        it('sends the request to the API host of the account\'s data center', async () => {

            const { context, requests, sent } = mockContext({
                answer: () => ({ status: 200, headers: {}, data: { users: [] } }),
                content: { url: '/bigin/v2/users', method: 'GET', parameters: '{"type":"CurrentUser"}' }
            });
            await MakeApiCall.receive(context);
            assert.strictEqual(requests[0].url, 'https://www.zohoapis.eu/bigin/v2/users');
            assert.deepStrictEqual(requests[0].params, { type: 'CurrentUser' });
            assert.strictEqual(requests[0].headers.Authorization, 'Zoho-oauthtoken token');
            assert.strictEqual(sent[0].data.statusCode, 200);
        });

        for (const url of ['https://attacker.example.com/bigin/v2/users', '//attacker.example.com/x', 'https://www.zohoapis.com/bigin/v2/users']) {
            it('refuses ' + url, async () => {

                const { context, requests } = mockContext({ content: { url, method: 'GET' } });
                await assert.rejects(() => MakeApiCall.receive(context), CancelError);
                assert.strictEqual(requests.length, 0);
            });
        }
    });

    describe('fieldsParam', () => {

        it('puts the time fields first and caps the module fields at 50', async () => {

            const many = Array.from({ length: 60 }, (x, i) => ({ api_name: 'Field_' + i }));
            many.push({ api_name: 'Created_Time' }, { api_name: 'Modified_Time' });
            const { context } = mockContext({ answer: () => ({ data: { fields: many } }) });
            const names = (await lib.fieldsParam(context, 'Contacts')).split(',');
            assert.strictEqual(names.length, 50);
            assert.deepStrictEqual(names.slice(0, 2), ['Created_Time', 'Modified_Time']);
        });

        it('refuses more than 50 fields the user listed', async () => {

            const { context } = mockContext();
            const listed = Array.from({ length: 51 }, (x, i) => 'Field_' + i).join(',');
            await assert.rejects(() => lib.fieldsParam(context, 'Contacts', listed), CancelError);
        });
    });

    describe('instant triggers', () => {

        const state = { channelId: '1001', channelExpiry: '2099-01-01T00:00:00+00:00', token: 'secret' };

        it('answers 403 to a notification without the channel token', async () => {

            const { context, sent, responses } = mockContext({
                properties: { module: 'Contacts' },
                state,
                webhook: { channel_id: 1001, token: 'wrong', operation: 'insert', module: 'Contacts', ids: ['1'] }
            });
            await NewRecord.receive(context);
            assert.strictEqual(responses[0].status, 403);
            assert.strictEqual(sent.length, 0);
        });

        it('sends each created record', async () => {

            const { context, sent, responses } = mockContext({
                properties: { module: 'Contacts' },
                state,
                webhook: { channel_id: 1001, token: 'secret', operation: 'insert', module: 'Contacts', ids: ['11', '12'] },
                answer: options => options.url.endsWith('/settings/fields')
                    ? FIELDS
                    : { data: { data: [{ id: options.url.split('/').pop(), Last_Name: 'Brooks' }] } }
            });
            await NewRecord.receive(context);
            assert.deepStrictEqual(sent.map(item => item.data.id), ['11', '12']);
            assert.strictEqual(responses[0].status, 200);
        });

        it('sends the id of a deleted record', async () => {

            const { context, sent } = mockContext({
                properties: { module: 'Contacts' },
                state,
                webhook: { channel_id: '1001', token: 'secret', operation: 'delete', module: 'Contacts', ids: ['13'], server_time: 1760000000000 }
            });
            await DeletedRecord.receive(context);
            assert.deepStrictEqual(sent[0].data, { id: '13', module: 'Contacts', deletedTime: new Date(1760000000000).toISOString() });
        });

        it('ignores a notification of another operation', async () => {

            const { context, sent } = mockContext({
                properties: { module: 'Contacts' },
                state,
                webhook: { channel_id: '1001', token: 'secret', operation: 'update', module: 'Contacts', ids: ['14'] }
            });
            await NewRecord.receive(context);
            assert.strictEqual(sent.length, 0);
        });
    });

    describe('New Record (Polling)', () => {

        const page = records => options => options.url.endsWith('/settings/fields') ? FIELDS : { data: { data: records, info: { more_records: false } } };

        it('records a baseline on the first tick and fires only for new records later', async () => {

            const first = mockContext({ properties: { module: 'Contacts' }, answer: page([{ id: '2', Created_Time: '2026-01-02T00:00:00+00:00' }]) });
            await NewRecordPolling.tick(first.context);
            assert.strictEqual(first.sent.length, 0);

            const second = mockContext({
                properties: { module: 'Contacts' },
                state: first.getState(),
                answer: page([
                    { id: '4', Created_Time: '2026-01-04T00:00:00+00:00' },
                    { id: '3', Created_Time: '2026-01-03T00:00:00+00:00' },
                    { id: '2', Created_Time: '2026-01-02T00:00:00+00:00' }
                ])
            });
            await NewRecordPolling.tick(second.context);
            assert.deepStrictEqual(second.sent.map(item => item.data.id), ['3', '4']);
        });

        it('keeps the known records when Bigin answers with no records', async () => {

            const state = { known: ['2'], floor: null };
            const { context, sent, getState } = mockContext({ properties: { module: 'Contacts' }, state, answer: page([]) });
            await NewRecordPolling.tick(context);
            assert.strictEqual(sent.length, 0);
            assert.deepStrictEqual(getState(), state);
        });
    });
});
