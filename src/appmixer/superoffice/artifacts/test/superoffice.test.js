'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const auth = require(path.join(ROOT, 'auth.js'));
const load = (name) => require(path.join(ROOT, 'core', name, name + '.js'));

class CancelError extends Error {}

const TENANT = 'Cust12345';
const API = 'https://online2.superoffice.com/Cust12345/api';

const jwt = (claims) => ['e30', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'sig'].join('.');

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { accessToken: '8A:Cust12345.token', tenantId: TENANT },
        config: {},
        properties: {},
        componentId: 'component-1',
        messages: { in: { content: {} } },
        CancelError,
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        loadState: async () => state,
        saveState: async (value) => {
            state = value;
        },
        lock: async () => ({ unlock: async () => {} }),
        staticCache: (() => {
            const cache = new Map();
            return { get: async (key) => cache.get(key), set: async (key, value) => cache.set(key, value) };
        })(),
        log: async () => {},
        ...overrides
    };
    context.sent = sent;
    context.getState = () => state;
    return context;
};

// The state endpoint answers first, then the API calls in order.
const stubApi = (context, ...responses) => {

    context.httpRequest.callsFake(async (options) => {
        if (options.url.startsWith('https://online.superoffice.com/api/state/')) {
            return { data: { IsRunning: true, State: 'Running', Api: API, ValidUntil: new Date(Date.now() + 600000).toISOString() } };
        }
        const next = responses.shift();
        if (next instanceof Error) {
            throw next;
        }
        return { status: 200, headers: {}, data: typeof next === 'function' ? next(options) : next };
    });
};

const apiCalls = (context) => context.httpRequest.getCalls().map(call => call.args[0]).filter(options => !options.url.includes('/api/state/'));

describe('superoffice', () => {

    describe('tenant and API host', () => {

        it('resolves the API base from the state endpoint of the configured environment', async () => {

            const context = createContext({ config: { environment: 'sod' } });
            context.httpRequest.resolves({ data: { IsRunning: true, Api: 'https://sod2.superoffice.com/Cust12345/api', ValidUntil: null } });
            const base = await lib.getApiBase(context);
            assert.strictEqual(base, 'https://sod2.superoffice.com/Cust12345/api/v1');
            assert.strictEqual(context.httpRequest.firstCall.args[0].url, 'https://sod.superoffice.com/api/state/Cust12345');
        });

        it('refuses an unknown environment before any request', async () => {

            const context = createContext({ config: { environment: 'evil.example.com/' } });
            await assert.rejects(lib.getApiBase(context), /Unsupported SuperOffice environment/);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('rejects API URLs outside superoffice.com or of another tenant', () => {

            assert.throws(() => lib.toApiBase('https://attacker.example/Cust12345/api', TENANT), /unexpected API URL/);
            assert.throws(() => lib.toApiBase('http://online2.superoffice.com/Cust12345/api', TENANT), /unexpected API URL/);
            assert.throws(() => lib.toApiBase('https://online2.superoffice.com/Cust99999/api', TENANT), /unexpected API URL/);
            assert.throws(() => lib.toApiBase('https://online2.superoffice.com.evil.example/Cust12345/api', TENANT), /unexpected API URL/);
            assert.strictEqual(lib.toApiBase('https://online2.superoffice.com/Cust12345/api/', TENANT), API + '/v1');
        });

        it('cancels when the tenant is not running', async () => {

            const context = createContext();
            context.httpRequest.resolves({ data: { IsRunning: false, State: 'Suspended' } });
            await assert.rejects(
                lib.getApiBase(context),
                (err) => err instanceof CancelError && /Suspended/.test(err.message)
            );
        });

        it('reads the tenant from the access token when it was not stored', () => {

            assert.strictEqual(lib.getTenantId({ auth: { accessToken: '8A:Cust777.abc' } }), 'Cust777');
            assert.throws(() => lib.getTenantId({ auth: { accessToken: 'opaque' } }), /tenant of this account is unknown/);
        });

        it('retries once on another host after 421 Misdirected Request', async () => {

            const context = createContext();
            const misdirected = Object.assign(new Error('421'), { response: { status: 421 } });
            stubApi(context, misdirected, { AssociateId: 5 });
            const body = await lib.request(context, { path: '/User/currentPrincipal' });
            assert.deepStrictEqual(body, { AssociateId: 5 });
            assert.strictEqual(context.httpRequest.getCalls().filter(c => c.args[0].url.includes('/api/state/')).length, 2);
        });

        it('turns client errors into CancelError with the SuperOffice message', async () => {

            const context = createContext();
            const notFound = Object.assign(new Error('404'), { response: { status: 404, data: { ErrorMessage: 'Contact 9 not found' } } });
            stubApi(context, notFound);
            await assert.rejects(lib.request(context, { path: '/Contact/9' }), (err) => err instanceof CancelError && /Contact 9 not found/.test(err.message));
        });
    });

    describe('auth', () => {

        it('builds the authorize URL on the environment host', () => {

            const url = new URL(auth.definition.authUrl({ clientId: 'cid', callbackUrl: 'https://cb.example/x', ticket: 't1', config: { environment: 'sod' } }));
            assert.strictEqual(url.origin + url.pathname, 'https://sod.superoffice.com/login/common/oauth/authorize');
            assert.strictEqual(url.searchParams.get('response_type'), 'code');
            assert.strictEqual(url.searchParams.get('scope'), 'openid');
            assert.strictEqual(url.searchParams.get('state'), 't1');
        });

        it('stores the tenant from the id_token', async () => {

            const httpRequest = sinon.stub().resolves({ data: {
                access_token: '8A:Cust12345.at', refresh_token: 'rt', expires_in: 3600,
                id_token: jwt({ [lib.CLAIM_PREFIX + 'ctx']: TENANT })
            } });
            const result = await auth.definition.requestAccessToken({ httpRequest, config: {}, clientId: 'cid', clientSecret: 'sec', authorizationCode: 'code', callbackUrl: 'https://cb' });
            assert.strictEqual(result.tenantId, TENANT);
            assert.strictEqual(result.refreshToken, 'rt');
            assert.strictEqual(httpRequest.firstCall.args[0].url, 'https://online.superoffice.com/login/common/oauth/tokens');
            assert.match(httpRequest.firstCall.args[0].data, /grant_type=authorization_code/);
        });

        it('refuses a token response without a tenant claim', async () => {

            const httpRequest = sinon.stub().resolves({ data: { access_token: 'x', id_token: jwt({ sub: 'a' }) } });
            await assert.rejects(auth.definition.requestAccessToken({ httpRequest, config: {} }), /which tenant/);
        });
    });

    describe('MakeApiCall', () => {

        const run = async (url) => {

            const context = createContext({ messages: { in: { content: { url, method: 'GET' } } } });
            stubApi(context, { ok: true });
            await load('MakeApiCall').receive(context);
            return { context, calls: apiCalls(context) };
        };

        it('resolves relative paths against the tenant API and sends the token there', async () => {

            const { context, calls } = await run('/v1/Contact/1');
            assert.strictEqual(calls[0].url, API + '/v1/Contact/1');
            assert.strictEqual(calls[0].headers.Authorization, 'Bearer 8A:Cust12345.token');
            assert.deepStrictEqual(context.sent[0].data.body, { ok: true });
        });

        for (const url of ['https://attacker.example/v1/Contact', '//attacker.example/v1', 'https://online2.superoffice.com/Cust99999/api/v1/Contact', '/../../Cust99999/api/v1', 'https://user:pw@online2.superoffice.com/Cust12345/api/v1']) {
            it('rejects ' + url + ' without sending the credential', async () => {

                const context = createContext({ messages: { in: { content: { url, method: 'GET' } } } });
                stubApi(context, { ok: true });
                await assert.rejects(load('MakeApiCall').receive(context), CancelError);
                assert.strictEqual(apiCalls(context).length, 0);
            });
        }
    });

    describe('entities', () => {

        it('creates a company from the default entity', async () => {

            const context = createContext({ messages: { in: { content: { name: 'Acme', categoryId: '3', email: 'a@acme.example' } } } });
            stubApi(context, { ContactId: 0, Name: '', Emails: [] }, (options) => ({ ...options.data, ContactId: 77 }));
            await load('CreateCompany').receive(context);
            const [defaults, post] = apiCalls(context);
            assert.strictEqual(defaults.url, API + '/v1/Contact/default');
            assert.strictEqual(post.method, 'POST');
            assert.deepStrictEqual(post.data.Category, { Id: 3 });
            assert.deepStrictEqual(post.data.Emails, [{ Value: 'a@acme.example' }]);
            assert.deepStrictEqual(context.sent[0].data, { id: 77, name: 'Acme', email: 'a@acme.example' });
        });

        it('updates only the provided fields with GET + PUT', async () => {

            const context = createContext({ messages: { in: { content: { companyId: '77', department: 'Sales' } } } });
            stubApi(context, { ContactId: 77, Name: 'Acme', Department: '' }, {});
            await load('UpdateCompany').receive(context);
            const [, put] = apiCalls(context);
            assert.strictEqual(put.method, 'PUT');
            assert.strictEqual(put.url, API + '/v1/Contact/77');
            assert.deepStrictEqual(put.data, { ContactId: 77, Name: 'Acme', Department: 'Sales' });
            assert.deepStrictEqual(context.sent[0].data, {});
        });

        it('rejects a non-numeric ID before calling the API', async () => {

            const context = createContext({ messages: { in: { content: { saleId: '1/../../User' } } } });
            stubApi(context);
            await assert.rejects(load('GetSale').receive(context), CancelError);
            assert.strictEqual(apiCalls(context).length, 0);
        });

        it('finds persons with escaped filters and removes duplicate rows', async () => {

            const context = createContext({ messages: { in: { content: { name: "O'Brien", companyId: '5', outputType: 'array' } } } });
            stubApi(context, { value: [
                { personId: 1, fullName: "Pat O'Brien", contactId: 5, email_emailAddress: 'a@x.example' },
                { personId: 1, fullName: "Pat O'Brien", contactId: 5, email_emailAddress: 'b@x.example' }
            ] });
            await load('FindPersons').receive(context);
            const [call] = apiCalls(context);
            assert.strictEqual(call.params.$filter, "(fullName contains 'O''Brien') and (contactId eq 5)");
            assert.strictEqual(call.params.$orderBy, 'personId desc');
            assert.strictEqual(context.sent[0].data.count, 1);
            assert.strictEqual(context.sent[0].data.result[0].email, 'a@x.example');
        });

        it('sends notFound when nothing matches', async () => {

            const context = createContext({ messages: { in: { content: { name: 'none', outputType: 'array' } } } });
            stubApi(context, { value: [] });
            await load('FindProjects').receive(context);
            assert.strictEqual(context.sent[0].port, 'notFound');
        });
    });

    describe('New* polling triggers', () => {

        const rows = (...ids) => ({ value: ids.map(id => ({ contactId: id, name: 'C' + id })) });

        it('records a baseline on the first tick, then emits only new items', async () => {

            const context = createContext();
            stubApi(context, rows(2, 1), rows(4, 3, 2, 1));
            const trigger = load('NewCompany');
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0);
            await trigger.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [3, 4]);
        });

        it('does not save an empty answer over known items', async () => {

            const context = createContext({ state: { known: [1, 2], floor: null } });
            stubApi(context, { value: [] }, rows(2, 1));
            const trigger = load('NewCompany');
            await trigger.tick(context);
            assert.deepStrictEqual(context.getState(), { known: [1, 2], floor: null });
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('does not fire old items pulled onto a full page', async () => {

            const ids = Array.from({ length: lib.TRIGGER_PAGE_SIZE }, (_, i) => 1000 - i);
            const context = createContext({ state: { known: ids, floor: ids[ids.length - 1] } });
            // Item 1000 was deleted; an older item (900) slides onto the page.
            stubApi(context, rows(...ids.slice(1), 900));
            await load('NewCompany').tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('test() emits the newest item without writing state', async () => {

            const context = createContext();
            stubApi(context, rows(9));
            await load('NewCompany').test(context);
            assert.strictEqual(context.sent[0].data.id, 9);
            assert.strictEqual(context.getState(), undefined);
            assert.strictEqual(apiCalls(context)[0].params.$top, 1);
        });
    });

    describe('ListListItems', () => {

        it('flattens list items, skips headings and deleted items, and maps them for dropdowns', async () => {

            const context = createContext({ properties: { isSource: true, listName: 'Category' } });
            stubApi(context, [
                { Id: -1, Name: 'Heading', ChildItems: [{ Id: 3, Name: 'Customer' }] },
                { Id: 4, Name: 'Old', Deleted: true },
                { Id: 5, Name: 'Prospect' }
            ]);
            const component = load('ListListItems');
            await component.receive(context);
            assert.strictEqual(apiCalls(context)[0].url, API + '/v1/List/Category/MDOItems');
            assert.deepStrictEqual(component.toSelectArray(context.sent[0].data), [{ label: 'Customer', value: '3' }, { label: 'Prospect', value: '5' }]);
        });

        it('refuses unknown list names', async () => {

            const context = createContext({ messages: { in: { content: { listName: '../User', outputType: 'array' } } } });
            stubApi(context);
            await assert.rejects(load('ListListItems').receive(context), CancelError);
        });
    });
});
