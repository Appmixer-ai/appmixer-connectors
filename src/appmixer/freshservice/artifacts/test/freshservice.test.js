'use strict';

const assert = require('assert');

const lib = require('../../lib');
const auth = require('../../auth');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const CreateTicket = require('../../core/CreateTicket/CreateTicket');
const UpdateTicket = require('../../core/UpdateTicket/UpdateTicket');
const FindTickets = require('../../core/FindTickets/FindTickets');
const FindRequesters = require('../../core/FindRequesters/FindRequesters');
const AddTicketNote = require('../../core/AddTicketNote/AddTicketNote');
const NewTicket = require('../../core/NewTicket/NewTicket');
const UpdatedTicket = require('../../core/UpdatedTicket/UpdatedTicket');
const NewChange = require('../../core/NewChange/NewChange');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const BASE = 'https://acme.freshservice.com/api/v2';

// A response of an Error makes httpRequest reject with it.
const createContext = ({ content = {}, properties = {}, state = {}, responses = [], authData } = {}) => {

    const context = {
        auth: authData || { domain: 'acme', apiKey: 'abcdefghij1234567890' },
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        messages: { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        cache: {},
        async httpRequest(options) {
            this.requests.push(options);
            const next = responses.length ? responses.shift() : { data: {} };
            if (next instanceof Error) {
                throw next;
            }
            return { status: 200, headers: {}, ...next };
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
        },
        async log() {},
        async lock() {
            return { unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value) => {
                context.cache[key] = value;
            }
        },
        async saveState(newState) {
            this.state = { ...newState };
        }
    };
    return context;
};

const httpError = (status, data, headers = {}) => Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data, headers }
});

const ticket = (id, createdAt, updatedAt = createdAt, extra = {}) => ({
    id, subject: `Ticket ${id}`, status: 2, priority: 1, created_at: createdAt, updated_at: updatedAt, group_id: null, ...extra
});

describe('Freshservice', function() {

    describe('domain allowlist', function() {

        it('accepts the account name and the full Freshservice host', function() {

            assert.strictEqual(lib.serviceOrigin('acme'), 'https://acme.freshservice.com');
            assert.strictEqual(lib.serviceOrigin('Acme-IT.freshservice.com'), 'https://acme-it.freshservice.com');
        });

        it('rejects anything that would move the API key to another host', function() {

            for (const domain of ['evil.example/x?', 'acme.evil.com', 'acme.freshservice.com.evil.com', 'acme@evil.com',
                'https://acme.freshservice.com', '', undefined, '-acme']) {
                assert.throws(() => lib.serviceOrigin(domain), /Invalid Freshservice domain/, String(domain));
            }
        });

        it('makes no request at all when the domain of the account is invalid', async function() {

            const context = createContext({ authData: { domain: 'evil.example/x?', apiKey: 'k' }, content: { ticketId: '1' } });
            await assert.rejects(() => require('../../core/GetTicket/GetTicket').receive(context), /Invalid Freshservice domain/);
            assert.strictEqual(context.requests.length, 0);

            const authContext = { domain: 'evil.example/x?', apiKey: 'k', requests: [], httpRequest(o) {
                this.requests.push(o);
                return { data: {} };
            } };
            await assert.rejects(() => auth.definition.validate(authContext), /Invalid Freshservice domain/);
            await assert.rejects(() => auth.definition.requestProfileInfo(authContext), /Invalid Freshservice domain/);
            assert.strictEqual(authContext.requests.length, 0);
        });
    });

    describe('auth', function() {

        it('sends the API key as the Basic user name with X as the password', async function() {

            const context = { domain: 'acme', apiKey: ' abcdefghij1234567890\n', requests: [], async httpRequest(o) {
                this.requests.push(o);
                return { data: { tickets: [] } };
            } };
            assert.strictEqual(await auth.definition.validate(context), true);
            assert.strictEqual(context.requests[0].url, `${BASE}/tickets`);
            assert.strictEqual(
                context.requests[0].headers.Authorization,
                'Basic ' + Buffer.from('abcdefghij1234567890:X').toString('base64')
            );
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(profile.name, 'acme.freshservice.com (abcd…7890)');
        });
    });

    describe('request', function() {

        it('turns a validation error into a CancelError with the Freshservice message', async function() {

            const context = createContext({
                responses: [httpError(400, {
                    description: 'Validation failed',
                    errors: [{ field: 'email', message: 'It should be a valid email address', code: 'invalid_value' }]
                })]
            });
            await assert.rejects(() => lib.request(context, { path: '/tickets' }), err => {
                assert.ok(err instanceof CancelError);
                const expected = /400: Validation failed; email It should be a valid email address \(invalid_value\)/;
                assert.match(err.message, expected);
                return true;
            });
        });

        it('retries a 429 after Retry-After', async function() {

            const context = createContext({ responses: [httpError(429, {}, { 'retry-after': '0' }), { data: { ok: true } }] });
            const { data } = await lib.request(context, { path: '/tickets' });
            assert.deepStrictEqual(data, { ok: true });
            assert.strictEqual(context.requests.length, 2);
        });

        it('leaves a long Retry-After to the engine', async function() {

            const context = createContext({ responses: [httpError(429, {}, { 'retry-after': '1521' })] });
            await assert.rejects(() => lib.request(context, { path: '/tickets' }), err => !(err instanceof CancelError));
            assert.strictEqual(context.requests.length, 1);
        });
    });

    describe('MakeApiCall', function() {

        it('resolves paths against the account API and pins the host', function() {

            const context = createContext();
            assert.strictEqual(lib.resolveApiUrl(context, '/tickets/1'), `${BASE}/tickets/1`);
            assert.strictEqual(lib.resolveApiUrl(context, 'tickets'), `${BASE}/tickets`);
            assert.strictEqual(lib.resolveApiUrl(context, '/api/v2/changes'), `${BASE}/changes`);
            assert.strictEqual(lib.resolveApiUrl(context, 'https://acme.freshservice.com/api/v2/agents'), `${BASE}/agents`);
            for (const url of ['https://evil.com/api/v2', '//evil.com/x', 'https://user:pw@acme.freshservice.com/api/v2',
                'https://other.freshservice.com/api/v2/tickets', 'http://acme.freshservice.com/api/v2/tickets']) {
                assert.throws(() => lib.resolveApiUrl(context, url), CancelError, url);
            }
        });

        it('sends the headers and query parameters the Designer stores as JSON strings', async function() {

            const context = createContext({
                content: { url: '/tickets', method: 'GET', headers: '{"X-Test":"1"}', parameters: '{"per_page":"5"}' },
                responses: [{ status: 200, data: { tickets: [] } }]
            });
            await MakeApiCall.receive(context);
            const [req] = context.requests;
            assert.strictEqual(req.url, `${BASE}/tickets`);
            assert.strictEqual(req.headers['X-Test'], '1');
            assert.ok(req.headers.Authorization.startsWith('Basic '));
            assert.deepStrictEqual(req.params, { per_page: '5' });
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });
    });

    describe('tickets', function() {

        it('creates a ticket with the requester ID, numbers and lists in the API shape', async function() {

            const context = createContext({
                content: {
                    subject: 'VPN down', description: '<p>No VPN</p>', email: 'a@example.com', requesterId: '42',
                    status: '2', priority: 3, tags: 'vpn, network', ccEmails: 'b@example.com',
                    customFields: '{"asset_tag":"LAP-1"}', dueBy: '2026-11-25T10:00:00.000Z'
                },
                responses: [{ data: { ticket: ticket(7, '2026-11-21T10:00:00Z') } }]
            });
            await CreateTicket.receive(context);
            const [req] = context.requests;
            assert.strictEqual(req.method, 'POST');
            assert.strictEqual(req.url, `${BASE}/tickets`);
            assert.deepStrictEqual(req.data, {
                subject: 'VPN down', description: '<p>No VPN</p>', status: 2, priority: 3,
                due_by: '2026-11-25T10:00:00Z', tags: ['vpn', 'network'], custom_fields: { asset_tag: 'LAP-1' },
                requester_id: 42, cc_emails: ['b@example.com']
            });
            // Blank fields come back as null; the output leaves them out.
            assert.strictEqual('group_id' in context.sent[0].data, false);
        });

        it('needs a requester email or ID', async function() {

            const context = createContext({ content: { subject: 's', description: 'd', status: 2, priority: 1 } });
            await assert.rejects(() => CreateTicket.receive(context), /Requester Email or Requester ID is required/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('rejects a ticket ID that is not a number before building the URL', async function() {

            const context = createContext({ content: { ticketId: '1/../../agents', status: 4 } });
            await assert.rejects(() => UpdateTicket.receive(context), /numeric Freshservice ID/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('updates only the fields that were filled in', async function() {

            const context = createContext({ content: { ticketId: '7', priority: 4, subject: '' } });
            await UpdateTicket.receive(context);
            assert.strictEqual(context.requests[0].method, 'PUT');
            assert.deepStrictEqual(context.requests[0].data, { priority: 4 });
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('adds a private note by default', async function() {

            const context = createContext({
                content: { ticketId: '7', body: 'Checked' },
                responses: [{ data: { conversation: { id: 1, ticket_id: 7, body: 'Checked', created_at: '2026-11-21T10:00:00Z' } } }]
            });
            await AddTicketNote.receive(context);
            assert.deepStrictEqual(context.requests[0].data, { body: 'Checked', private: true });
            assert.strictEqual(context.requests[0].url, `${BASE}/tickets/7/notes`);
        });
    });

    describe('find', function() {

        it('sends a filter query in double quotes and reads pages up to the total', async function() {

            const page1 = Array.from({ length: 30 }, (_, i) => ticket(i + 1, '2026-11-21T10:00:00Z'));
            const context = createContext({
                content: { query: 'status:2 AND priority:4', outputType: 'array' },
                responses: [{ data: { tickets: page1, total: 31 } }, { data: { tickets: [ticket(31, '2026-11-21T10:00:00Z')], total: 31 } }]
            });
            await FindTickets.receive(context);
            assert.strictEqual(context.requests[0].url, `${BASE}/tickets/filter`);
            assert.deepStrictEqual(context.requests[0].params, { query: '"status:2 AND priority:4"', page: 1 });
            assert.strictEqual(context.requests[1].params.page, 2);
            assert.strictEqual(context.sent[0].data.count, 31);
        });

        it('keeps a query the user already quoted and limits its length', function() {

            const context = createContext();
            assert.strictEqual(lib.filterQuery(context, '"priority:3"'), '"priority:3"');
            assert.strictEqual(lib.filterQuery(context, '  '), undefined);
            assert.throws(() => lib.filterQuery(context, 'x'.repeat(520)), /512/);
        });

        it('lists the recent tickets without a query and reports no match on notFound', async function() {

            const context = createContext({ content: { outputType: 'first' }, responses: [{ data: { tickets: [] } }] });
            await FindTickets.receive(context);
            assert.strictEqual(context.requests[0].url, `${BASE}/tickets`);
            assert.deepStrictEqual(context.requests[0].params, { order_type: 'desc', page: 1, per_page: 100 });
            assert.strictEqual(context.sent[0].port, 'notFound');
        });

        it('finds a requester by the exact email filter of the list', async function() {

            const context = createContext({
                content: { email: ' ron@example.com ', outputType: 'first' },
                responses: [{ data: { requesters: [{ id: 5, first_name: 'Ron', active: true, job_title: null }] } }]
            });
            await FindRequesters.receive(context);
            assert.strictEqual(context.requests[0].url, `${BASE}/requesters`);
            assert.strictEqual(context.requests[0].params.email, 'ron@example.com');
            assert.deepStrictEqual(context.sent[0].data, { id: 5, first_name: 'Ron', active: true, index: 0, count: 1 });
        });
    });

    describe('New Ticket trigger', function() {

        it('emits nothing on the first check, then the tickets created after it', async function() {

            const context = createContext({
                responses: [
                    { data: { tickets: [ticket(2, '2026-11-21T10:00:00Z'), ticket(1, '2026-11-21T09:00:00Z')] } },
                    { data: { tickets: [ticket(4, '2026-11-21T10:05:00Z'), ticket(3, '2026-11-21T10:01:00Z'), ticket(2, '2026-11-21T10:00:00Z')] } }
                ]
            });
            await NewTicket.tick(context);
            assert.strictEqual(context.sent.length, 0);
            assert.deepStrictEqual(context.requests[0].params, { order_type: 'desc', page: 1, per_page: 100 });

            await NewTicket.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [3, 4]);
        });

        it('keeps the state when an answer comes back empty', async function() {

            const context = createContext({
                responses: [
                    { data: { tickets: [ticket(2, '2026-11-21T10:00:00Z')] } },
                    { data: { tickets: [] } },
                    { data: { tickets: [ticket(3, '2026-11-21T10:01:00Z'), ticket(2, '2026-11-21T10:00:00Z')] } }
                ]
            });
            await NewTicket.tick(context);
            await NewTicket.tick(context);
            await NewTicket.tick(context);
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [3]);
        });

        it('reads more pages when more than a page of tickets is new', async function() {

            const page = Array.from({ length: 100 }, (_, i) => ticket(300 - i, new Date(Date.parse('2026-11-21T12:00:00Z') - i * 1000).toISOString()));
            const context = createContext({
                state: { initialized: true, lastTimestamp: Date.parse('2026-11-21T10:00:00Z'), known: ['1'] },
                responses: [{ data: { tickets: page } }, { data: { tickets: [ticket(150, '2026-11-21T10:30:00Z'), ticket(1, '2026-11-21T10:00:00Z')] } }]
            });
            await NewTicket.tick(context);
            assert.strictEqual(context.requests.length, 2);
            assert.strictEqual(context.sent.length, 101);
        });

        it('test() emits the newest ticket without touching the state', async function() {

            const context = createContext({ responses: [{ data: { tickets: [ticket(9, '2026-11-21T10:00:00Z')] } }] });
            await NewTicket.test(context);
            assert.deepStrictEqual(context.requests[0].params, { order_type: 'desc', page: 1, per_page: 1 });
            assert.strictEqual(context.sent[0].data.id, 9);
            assert.deepStrictEqual(context.state, {});
        });
    });

    describe('Updated Ticket trigger', function() {

        it('emits each update once and skips creations', async function() {

            const start = Date.parse('2026-11-21T10:00:00Z');
            const context = createContext();
            await lib.pollUpdates(context, { fetch: async () => [], now: start });
            assert.deepStrictEqual(context.state, { initialized: true, since: start, seen: [] });

            const updated = ticket(1, '2026-11-20T10:00:00Z', '2026-11-21T10:01:00Z');
            const created = ticket(2, '2026-11-21T10:02:00Z');
            const fetched = [];
            const fetch = async since => {
                fetched.push(since);
                return [updated, created];
            };
            const accept = t => t.updated_at !== t.created_at;
            await lib.pollUpdates(context, { fetch, accept });
            await lib.pollUpdates(context, { fetch, accept });
            assert.deepStrictEqual(context.sent.map(s => s.data.id), [1]);
            // The window starts two minutes before the last seen update.
            assert.strictEqual(fetched[0], '2026-11-21T09:58:00Z');

            const again = ticket(1, '2026-11-20T10:00:00Z', '2026-11-21T10:03:00Z');
            await lib.pollUpdates(context, { fetch: async () => [updated, created, again], accept });
            assert.deepStrictEqual(context.sent.map(s => s.data.updated_at), ['2026-11-21T10:01:00Z', '2026-11-21T10:03:00Z']);
        });

        it('asks for the tickets updated since the window start', async function() {

            const context = createContext({
                state: { initialized: true, since: Date.parse('2026-11-21T10:00:00Z'), seen: [] },
                responses: [{ data: { tickets: [ticket(1, '2026-11-20T10:00:00Z', '2026-11-21T10:01:00Z')] } }]
            });
            await UpdatedTicket.tick(context);
            assert.deepStrictEqual(context.requests[0].params, {
                updated_since: '2026-11-21T09:58:00Z', order_type: 'desc', page: 1, per_page: 100
            });
            assert.strictEqual(context.sent.length, 1);
        });
    });

    describe('New Change trigger', function() {

        it('asks for the newest changes first', async function() {

            const context = createContext({ responses: [{ data: { changes: [{ id: 3, created_at: '2026-11-21T10:00:00Z' }] } }] });
            await NewChange.test(context);
            assert.deepStrictEqual(context.requests[0].params, { order_by: 'created_at', order_type: 'desc', page: 1, per_page: 1 });
            assert.strictEqual(context.requests[0].url, `${BASE}/changes`);
            assert.strictEqual(context.sent[0].data.id, 3);
        });
    });

    describe('CSV', function() {

        it('quotes cells and keeps columns by header', function() {

            assert.strictEqual(lib.toCsv([{ a: 'x,y', b: 'say "hi"' }, { b: 1 }]), 'a,b\n"x,y","say ""hi"""\n,1');
            assert.strictEqual(lib.toCsv([]), '');
        });
    });
});
