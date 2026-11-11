'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../utils');

const CONNECTOR = path.join(__dirname, '../../src/appmixer/loops');
const component = name => require(path.join(CONNECTOR, 'core', name, `${name}.js`));

const API = 'https://app.loops.so/api';

const contextFor = (content, properties = {}) => {
    const context = createMockContext();
    context.auth = { apiKey: 'test-api-key' };
    context.properties = properties;
    context.messages = { in: { content } };
    context.httpRequest.resolves({ status: 200, headers: {}, data: { success: true, id: 'cnt_1' } });
    return context;
};

const lastRequest = context => context.httpRequest.lastCall.args[0];

describe('appmixer.loops', function() {

    describe('auth.js', () => {

        it('uses the team name as the account name', async () => {
            const auth = require(path.join(CONNECTOR, 'auth.js'));
            const httpRequest = sinon.stub().resolves({ data: { success: true, teamName: 'Acme' } });
            const profile = await auth.definition.requestProfileInfo({ apiKey: 'k', httpRequest });
            assert.deepStrictEqual(profile, { teamName: 'Acme' });
            assert.strictEqual(auth.definition.accountNameFromProfileInfo, 'teamName');
            assert.strictEqual(httpRequest.firstCall.args[0].url, `${API}/v1/api-key`);
            assert.strictEqual(httpRequest.firstCall.args[0].headers.Authorization, 'Bearer k');
        });
    });

    describe('CreateContact', () => {

        it('sends contact fields, custom properties and mailing lists', async () => {
            const context = contextFor({
                email: 'alex@example.com',
                firstName: 'Alex',
                lastName: '',
                subscribed: true,
                mailingLists: 'list1, list2',
                customProperties: '{"planName":"Pro","seats":5}'
            });
            await component('CreateContact').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.method, 'POST');
            assert.strictEqual(req.url, `${API}/v1/contacts/create`);
            assert.strictEqual(req.headers.Authorization, 'Bearer test-api-key');
            assert.deepStrictEqual(req.data, {
                planName: 'Pro',
                seats: 5,
                email: 'alex@example.com',
                firstName: 'Alex',
                subscribed: true,
                mailingLists: { list1: true, list2: true }
            });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ id: 'cnt_1', email: 'alex@example.com' }, 'out']);
        });

        it('rejects invalid custom properties before any request', async () => {
            const context = contextFor({ email: 'alex@example.com', customProperties: '[1,2]' });
            await assert.rejects(component('CreateContact').receive(context), /Custom Properties must be a JSON object/);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('UpdateContact', () => {

        it('leaves subscribed out unless asked and maps list removals', async () => {
            const context = contextFor({
                email: 'alex@example.com',
                userId: 'u1',
                subscribed: '',
                mailingLists: ['a'],
                removeFromMailingLists: ['b']
            });
            await component('UpdateContact').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.method, 'PUT');
            assert.strictEqual(req.url, `${API}/v1/contacts/update`);
            assert.deepStrictEqual(req.data, { email: 'alex@example.com', userId: 'u1', mailingLists: { a: true, b: false } });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'out']);
        });

        it('unsubscribes the contact', async () => {
            const context = contextFor({ email: 'alex@example.com', subscribed: 'unsubscribe' });
            await component('UpdateContact').receive(context);
            assert.strictEqual(lastRequest(context).data.subscribed, false);
        });
    });

    describe('FindContact', () => {

        it('requires exactly one of email and user ID', async () => {
            await assert.rejects(component('FindContact').receive(contextFor({})), /Email or User ID is required/);
            await assert.rejects(component('FindContact').receive(contextFor({ email: 'a@example.com', userId: 'u' })),
                /not both/);
        });

        it('sends to notFound for an empty result', async () => {
            const context = contextFor({ userId: 'u1', outputType: 'first' });
            context.httpRequest.resolves({ data: [] });
            await component('FindContact').receive(context);
            assert.deepStrictEqual(lastRequest(context).params, { userId: 'u1' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ userId: 'u1' }, 'notFound']);
        });

        it('returns the contact', async () => {
            const context = contextFor({ email: 'a@example.com', outputType: 'first' });
            context.httpRequest.resolves({ data: [{ id: 'c1', email: 'a@example.com' }] });
            await component('FindContact').receive(context);
            assert.deepStrictEqual(context.sendJson.lastCall.args,
                [{ id: 'c1', email: 'a@example.com', index: 0, count: 1 }, 'out']);
        });
    });

    describe('DeleteContact', () => {

        it('deletes by user ID', async () => {
            const context = contextFor({ identifyBy: 'userId', identifier: 'u1' });
            await component('DeleteContact').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.url, `${API}/v1/contacts/delete`);
            assert.deepStrictEqual(req.data, { userId: 'u1' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{}, 'out']);
        });
    });

    describe('SendEvent', () => {

        it('sends event properties, contact properties and the idempotency key', async () => {
            const context = contextFor({
                eventName: 'signup',
                email: 'a@example.com',
                eventProperties: '{"plan":"pro"}',
                contactProperties: { firstName: 'Alex' },
                idempotencyKey: 'key-1'
            });
            await component('SendEvent').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.url, `${API}/v1/events/send`);
            assert.strictEqual(req.headers['Idempotency-Key'], 'key-1');
            assert.deepStrictEqual(req.data, {
                firstName: 'Alex',
                email: 'a@example.com',
                eventName: 'signup',
                eventProperties: { plan: 'pro' }
            });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ success: true, eventName: 'signup' }, 'out']);
        });

        it('requires email or user ID', async () => {
            await assert.rejects(component('SendEvent').receive(contextFor({ eventName: 'x' })), /Email or User ID/);
        });
    });

    describe('SendTransactionalEmail', () => {

        it('sends data variables', async () => {
            const context = contextFor({
                transactionalId: 'tx1',
                email: 'a@example.com',
                addToAudience: false,
                dataVariables: '{"name":"Alex"}'
            });
            await component('SendTransactionalEmail').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.url, `${API}/v1/transactional`);
            assert.deepStrictEqual(req.data, {
                transactionalId: 'tx1',
                email: 'a@example.com',
                addToAudience: false,
                dataVariables: { name: 'Alex' }
            });
        });
    });

    describe('ListTransactionalEmails', () => {

        it('follows the pagination cursor', async () => {
            const context = contextFor({ outputType: 'array' });
            context.httpRequest.onFirstCall().resolves({ data: { data: [{ id: 't1' }], pagination: { nextCursor: 'c2' } } });
            context.httpRequest.onSecondCall().resolves({ data: { data: [{ id: 't2' }], pagination: { nextCursor: null } } });
            await component('ListTransactionalEmails').receive(context);
            assert.strictEqual(context.httpRequest.callCount, 2);
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, `${API}/v1/transactional-emails`);
            assert.deepStrictEqual(context.httpRequest.secondCall.args[0].params, { perPage: '50', cursor: 'c2' });
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ result: [{ id: 't1' }, { id: 't2' }], count: 2 }, 'out']);
        });

        it('returns an empty list to the inspector on error', async () => {
            const context = contextFor({}, { isSource: true });
            context.httpRequest.rejects(new Error('boom'));
            await component('ListTransactionalEmails').receive(context);
            assert.deepStrictEqual(context.sendJson.lastCall.args, [{ result: [] }, 'out']);
        });
    });

    describe('ListMailingLists', () => {

        it('maps lists to dropdown options', () => {
            const options = component('ListMailingLists').toSelectArray({ result: [{ id: 'l1', name: 'News' }] });
            assert.deepStrictEqual(options, [{ label: 'News', value: 'l1' }]);
        });
    });

    describe('lib.request', () => {

        it('retries a 429 response', async () => {
            const lib = require(path.join(CONNECTOR, 'lib.js'));
            const context = contextFor({});
            const tooMany = Object.assign(new Error('429'), { response: { status: 429, headers: { 'retry-after': '0.01' } } });
            context.httpRequest.onFirstCall().rejects(tooMany);
            context.httpRequest.onSecondCall().resolves({ data: [] });
            const { data } = await lib.request(context, { path: '/v1/lists' });
            assert.deepStrictEqual(data, []);
            assert.strictEqual(context.httpRequest.callCount, 2);
        });
    });

    describe('MakeApiCall', () => {

        it('resolves a relative path under /api', async () => {
            const context = contextFor({ url: '/v1/lists', method: 'GET', parameters: '{"list":"custom"}' });
            await component('MakeApiCall').receive(context);
            const req = lastRequest(context);
            assert.strictEqual(req.url, `${API}/v1/lists`);
            assert.deepStrictEqual(req.params, { list: 'custom' });
        });

        ['https://evil.example/v1/lists', '//evil.example/x', 'https://user:pw@app.loops.so/api/v1/lists']
            .forEach(url => {
                it(`refuses ${url} without sending the API key`, async () => {
                    const context = contextFor({ url, method: 'GET' });
                    await assert.rejects(component('MakeApiCall').receive(context));
                    assert.strictEqual(context.httpRequest.callCount, 0);
                });
            });
    });
});
