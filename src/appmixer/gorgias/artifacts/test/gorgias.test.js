'use strict';

const assert = require('assert');

const lib = require('../../lib');
const auth = require('../../auth');
const CreateTicket = require('../../core/CreateTicket/CreateTicket');
const UpdateTicket = require('../../core/UpdateTicket/UpdateTicket');
const FindTickets = require('../../core/FindTickets/FindTickets');
const AddTicketTags = require('../../core/AddTicketTags/AddTicketTags');
const CreateTicketMessage = require('../../core/CreateTicketMessage/CreateTicketMessage');
const CreateCustomer = require('../../core/CreateCustomer/CreateCustomer');
const ListTags = require('../../core/ListTags/ListTags');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewTicket = require('../../core/NewTicket/NewTicket');
const UpdatedTicket = require('../../core/UpdatedTicket/UpdatedTicket');
const NewTicketMessage = require('../../core/NewTicketMessage/NewTicketMessage');
const NewCustomer = require('../../core/NewCustomer/NewCustomer');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

const API = 'https://acme.gorgias.com/api';

// A response of an Error makes httpRequest reject with it.
const createContext = ({ content = {}, properties = {}, state = {}, responses = [], auth: account, webhook } = {}) => {

    const context = {
        auth: account || { subdomain: 'acme', username: 'agent@example.com', apiKey: 'key-123' },
        config: {},
        properties,
        state: { ...state },
        componentId: 'component-1',
        flowId: 'flow-1',
        messages: webhook ? { webhook: { content: { data: webhook } } } : { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        cache: {},
        responded: false,
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
            return { async unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value) => {
                context.cache[key] = value;
            }
        },
        async saveState(newState) {
            this.state = { ...newState };
        },
        async loadState() {
            return this.state;
        },
        getWebhookUrl() {
            return 'https://api.appmixer.example/flows/flow-1/components/component-1';
        },
        response() {
            this.responded = true;
        }
    };
    return context;
};

const httpError = (status, data, headers = {}) => Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data, headers }
});

describe('Gorgias', function() {

    describe('lib', function() {

        it('authenticates with Basic auth of the login email and the API key, trimmed', function() {
            const { Authorization } = lib.authHeaders({ username: ' agent@example.com ', apiKey: 'key-123\n' });
            assert.strictEqual(Authorization, 'Basic ' + Buffer.from('agent@example.com:key-123').toString('base64'));
        });

        it('accepts a plain subdomain only', function() {
            assert.strictEqual(lib.apiOrigin('acme-store'), 'https://acme-store.gorgias.com');
            for (const bad of ['evil.example/x?', 'acme.gorgias.com', '', '-acme', 'a b', undefined]) {
                assert.throws(() => lib.apiOrigin(bad), /Invalid Gorgias subdomain/);
            }
        });

        it('makes no request when the stored subdomain is invalid', async function() {
            const context = createContext({ auth: { subdomain: 'evil.example/x?', username: 'a@b.c', apiKey: 'k' } });
            await assert.rejects(lib.request(context, { path: '/tickets' }), CancelError);
            assert.strictEqual(context.requests.length, 0);
        });

        it('auth.js validates the subdomain before calling the API', async function() {
            const context = createContext();
            Object.assign(context, { subdomain: 'evil.example/x?', username: 'a@b.c', apiKey: 'k' });
            await assert.rejects(auth.definition.validate(context), /Invalid Gorgias subdomain/);
            assert.strictEqual(context.requests.length, 0);
        });

        it('auth.js names the account after the user and the helpdesk', async function() {
            const context = createContext({ responses: [{ data: { domain: 'acme' } }] });
            Object.assign(context, { subdomain: 'acme', username: 'agent@example.com', apiKey: 'k' });
            const profile = await auth.definition.requestProfileInfo(context);
            assert.strictEqual(profile.name, 'agent@example.com (acme.gorgias.com)');
            assert.strictEqual(context.requests[0].url, API + '/account');
        });

        it('retries a 429 after Retry-after', async function() {
            const context = createContext({ responses: [httpError(429, {}, { 'retry-after': '0' }), { data: { id: 1 } }] });
            const { data } = await lib.request(context, { path: '/tickets/1' });
            assert.deepStrictEqual(data, { id: 1 });
            assert.strictEqual(context.requests.length, 2);
        });

        it('rejects IDs that are not numbers before they reach a URL path', function() {
            const context = createContext();
            assert.throws(() => lib.requireId(context, '12/../../users', 'Ticket ID'), CancelError);
            assert.strictEqual(lib.requireId(context, ' 42 ', 'Ticket ID'), 42);
        });

        it('normalizes multiselect input from arrays and comma-separated strings', function() {
            const context = createContext();
            assert.deepStrictEqual(lib.normalizeMultiselectInput('vip, refund,,', context, 'Tags'), ['vip', 'refund']);
            assert.deepStrictEqual(lib.normalizeMultiselectInput(['vip'], context, 'Tags'), ['vip']);
        });
    });

    describe('MakeApiCall', function() {

        it('pins the origin to the account host', function() {
            const context = createContext();
            assert.strictEqual(lib.resolveApiUrl(context, '/tickets'), API + '/tickets');
            assert.strictEqual(lib.resolveApiUrl(context, '/api/tickets?limit=1'), API + '/tickets?limit=1');
            assert.strictEqual(lib.resolveApiUrl(context, API + '/account'), API + '/account');
            for (const bad of ['https://evil.example/api', '//evil.example/api', 'https://user:pw@acme.gorgias.com/api',
                'https://acme.gorgias.com.evil.example/api']) {
                assert.throws(() => lib.resolveApiUrl(context, bad), CancelError, bad);
            }
        });

        it('sends the headers and query parameters stored by the designer', async function() {
            const context = createContext({
                content: { url: '/tickets', method: 'GET', headers: '{"X-Test":"1"}', parameters: '{"limit":"5"}' },
                responses: [{ status: 200, data: { data: [] } }]
            });
            await MakeApiCall.receive(context);
            const [req] = context.requests;
            assert.strictEqual(req.url, API + '/tickets');
            assert.strictEqual(req.headers['X-Test'], '1');
            assert.ok(req.headers.Authorization.startsWith('Basic '));
            assert.deepStrictEqual(req.params, { limit: '5' });
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });
    });

    describe('tickets', function() {

        it('CreateTicket sends a customer message on the API channel', async function() {
            const context = createContext({
                content: {
                    customerEmail: 'jane@example.com', customerName: 'Jane', subject: 'Order', message: 'Hi',
                    tags: 'vip,refund', assigneeUserId: '7', priority: 'high'
                },
                responses: [{ data: { id: 99 } }]
            });
            await CreateTicket.receive(context);
            const { method, url, data } = context.requests[0];
            assert.strictEqual(method, 'POST');
            assert.strictEqual(url, API + '/tickets');
            assert.deepStrictEqual(data.customer, { email: 'jane@example.com', name: 'Jane' });
            assert.deepStrictEqual(data.tags, [{ name: 'vip' }, { name: 'refund' }]);
            assert.deepStrictEqual(data.assignee_user, { id: 7 });
            const [message] = data.messages;
            assert.strictEqual(message.channel, 'api');
            assert.strictEqual(message.via, 'api');
            assert.strictEqual(message.from_agent, false);
            assert.deepStrictEqual(message.sender, { email: 'jane@example.com', name: 'Jane' });
            assert.strictEqual(message.body_text, 'Hi');
            assert.deepStrictEqual(context.sent[0], { data: { id: 99 }, port: 'out' });
        });

        it('UpdateTicket sends only the filled-in fields and returns {}', async function() {
            const context = createContext({ content: { ticketId: '5', status: 'closed', subject: '' } });
            await UpdateTicket.receive(context);
            assert.strictEqual(context.requests[0].method, 'PUT');
            assert.deepStrictEqual(context.requests[0].data, { status: 'closed' });
            assert.deepStrictEqual(context.sent[0].data, {});
        });

        it('FindTickets excludes trashed tickets unless asked and reports notFound', async function() {
            const context = createContext({
                content: { customerId: '3', outputType: 'array' },
                responses: [{ data: { data: [], meta: { next_cursor: null } } }]
            });
            await FindTickets.receive(context);
            assert.deepStrictEqual(context.requests[0].params, {
                limit: 100, order_by: 'created_datetime:desc', trashed: false, customer_id: 3
            });
            assert.strictEqual(context.sent[0].port, 'notFound');
        });

        it('AddTicketTags posts the tag names', async function() {
            const context = createContext({ content: { ticketId: '5', tags: ['vip', 'refund'] } });
            await AddTicketTags.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/tickets/5/tags');
            assert.deepStrictEqual(context.requests[0].data, { names: ['vip', 'refund'] });
            assert.deepStrictEqual(context.sent[0].data, { ticketId: 5, tags: ['vip', 'refund'] });
        });

        it('AddTicketTags creates tags that do not exist yet and adds them again', async function() {
            const context = createContext({
                content: { ticketId: '5', tags: 'vip, brand-new' },
                responses: [
                    httpError(400, { error: { msg: 'Tag(s) not found: [\'brand-new\']' } }),
                    httpError(400, { error: { msg: 'A tag with this name already exists.' } }),
                    { status: 201, data: { id: 9, name: 'brand-new' } },
                    { status: 201, data: {} }
                ]
            });
            await AddTicketTags.receive(context);
            assert.deepStrictEqual(context.requests.map(r => [r.method, r.url, r.data]), [
                ['POST', API + '/tickets/5/tags', { names: ['vip', 'brand-new'] }],
                ['POST', API + '/tags', { name: 'vip' }],
                ['POST', API + '/tags', { name: 'brand-new' }],
                ['POST', API + '/tickets/5/tags', { names: ['vip', 'brand-new'] }]
            ]);
            assert.deepStrictEqual(context.sent[0].data, { ticketId: 5, tags: ['vip', 'brand-new'] });
        });

        it('AddTicketTags passes other errors through', async function() {
            const context = createContext({
                content: { ticketId: '5', tags: ['vip'] },
                responses: [httpError(404, { error: { msg: 'Not found' } })]
            });
            await assert.rejects(AddTicketTags.receive(context), err => err.response.status === 404);
            assert.strictEqual(context.requests.length, 1);
        });

        it('ListTags reads one page of 100 tags and sends { result, count }', async function() {
            const context = createContext({
                responses: [{ data: { data: [{ id: 1, name: 'vip' }], meta: { next_cursor: 'next' } } }]
            });
            await ListTags.receive(context);
            assert.strictEqual(context.requests.length, 1);
            assert.strictEqual(context.requests[0].params.limit, 100);
            assert.deepStrictEqual(context.sent[0], { data: { result: [{ id: 1, name: 'vip' }], count: 1 }, port: 'out' });
        });

        it('ListTags answers an empty list to a failing picker call', async function() {
            const context = createContext({
                properties: { isSource: true }, responses: [httpError(500, {})]
            });
            await ListTags.receive(context);
            assert.deepStrictEqual(context.sent[0].data, { result: [], count: 0 });
            assert.deepStrictEqual(ListTags.toSelectArray({ result: [{ id: 1, name: 'vip' }] }), [{ label: 'vip', value: 'vip' }]);
        });
    });

    describe('ticket messages', function() {

        it('an internal note is sent by the connected user by default', function() {
            const context = createContext();
            const message = CreateTicketMessage.buildMessage(context, { messageType: 'internal-note', message: 'Note' });
            assert.strictEqual(message.channel, 'internal-note');
            assert.strictEqual(message.from_agent, true);
            assert.deepStrictEqual(message.sender, { email: 'agent@example.com' });
            assert.strictEqual(message.receiver, undefined);
        });

        it('a customer message needs the customer email', function() {
            const context = createContext();
            assert.throws(() => CreateTicketMessage.buildMessage(context, { messageType: 'customer-message', message: 'x' }), CancelError);
            const message = CreateTicketMessage.buildMessage(context, {
                messageType: 'customer-message', message: 'x', senderEmail: 'jane@example.com'
            });
            assert.strictEqual(message.from_agent, false);
            assert.deepStrictEqual(message.sender, { email: 'jane@example.com' });
        });

        it('an email reply goes from an email integration to the customer', function() {
            const context = createContext();
            assert.throws(() => CreateTicketMessage.buildMessage(context, {
                messageType: 'email-reply', message: 'x', receiverEmail: 'jane@example.com'
            }), /From Address/);
            const message = CreateTicketMessage.buildMessage(context, {
                messageType: 'email-reply', message: 'x', receiverEmail: 'jane@example.com', fromAddress: 'support@shop.com'
            });
            assert.strictEqual(message.channel, 'email');
            assert.deepStrictEqual(message.receiver, { email: 'jane@example.com' });
            assert.deepStrictEqual(message.source, {
                type: 'email', from: { address: 'support@shop.com' }, to: [{ address: 'jane@example.com' }]
            });
        });
    });

    describe('customers', function() {

        it('CreateCustomer turns the email and the phone into channels', async function() {
            const context = createContext({
                content: { email: 'jane@example.com', phone: '+14155550123', name: 'Jane' },
                responses: [{ data: { id: 1 } }]
            });
            await CreateCustomer.receive(context);
            assert.deepStrictEqual(context.requests[0].data, {
                email: 'jane@example.com',
                name: 'Jane',
                channels: [
                    { type: 'email', address: 'jane@example.com', preferred: true },
                    { type: 'phone', address: '+14155550123', preferred: false }
                ]
            });
        });

        it('CreateCustomer refuses an empty customer', async function() {
            const context = createContext({ content: {} });
            await assert.rejects(CreateCustomer.receive(context), CancelError);
            assert.strictEqual(context.requests.length, 0);
        });
    });

    describe('webhook triggers', function() {

        it('start registers an HTTP integration for one event and stop removes it', async function() {
            const context = createContext({ responses: [{ data: { id: 321 } }, { data: {} }] });
            await NewTicket.start(context);
            const { method, url, data } = context.requests[0];
            assert.strictEqual(method, 'POST');
            assert.strictEqual(url, API + '/integrations');
            assert.strictEqual(data.type, 'http');
            assert.strictEqual(data.http.url, context.getWebhookUrl());
            assert.deepStrictEqual(data.http.triggers, {
                ticket_created: true, ticket_updated: false, ticket_message_created: false
            });
            assert.strictEqual(data.http.form.ticket_id, '{{ticket.id}}');
            assert.deepStrictEqual(context.state, { integrationId: 321 });

            await NewTicket.stop(context);
            assert.strictEqual(context.requests[1].method, 'DELETE');
            assert.strictEqual(context.requests[1].url, API + '/integrations/321');
        });

        it('stop ignores an integration that is gone already', async function() {
            const context = createContext({ state: { integrationId: 9 }, responses: [httpError(404, {})] });
            await UpdatedTicket.stop(context);
        });

        it('receive reads the ticket back and emits it once', async function() {
            const ticket = { id: 77, updated_datetime: '2026-11-20T10:00:00' };
            const context = createContext({ webhook: { ticket_id: '77' }, responses: [{ data: ticket }, { data: ticket }] });
            await NewTicket.receive(context);
            await NewTicket.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/tickets/77');
            assert.strictEqual(context.sent.length, 1);
            assert.deepStrictEqual(context.sent[0], { data: ticket, port: 'out' });
            assert.ok(context.responded);
        });

        it('UpdatedTicket emits each new version of a ticket', async function() {
            const context = createContext({
                webhook: { ticket_id: 77 },
                responses: [{ data: { id: 77, updated_datetime: 'a' } }, { data: { id: 77, updated_datetime: 'b' } }]
            });
            await UpdatedTicket.receive(context);
            await UpdatedTicket.receive(context);
            assert.strictEqual(context.sent.length, 2);
        });

        it('receive ignores a call without a ticket ID and makes no request', async function() {
            const context = createContext({ webhook: { ticket_id: '{{ticket.id}}' } });
            await NewTicket.receive(context);
            assert.strictEqual(context.requests.length, 0);
            assert.strictEqual(context.sent.length, 0);
            assert.ok(context.responded);
        });

        it('NewTicketMessage reads the message by ID, or the newest message of the ticket', async function() {
            let context = createContext({ webhook: { ticket_id: '5', message_id: '9' }, responses: [{ data: { id: 9 } }] });
            await NewTicketMessage.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/tickets/5/messages/9');
            assert.deepStrictEqual(context.sent[0].data, { id: 9 });

            context = createContext({ webhook: { ticket_id: '5', message_id: '' }, responses: [{ data: { data: [{ id: 10 }] } }] });
            await NewTicketMessage.receive(context);
            assert.strictEqual(context.requests[0].url, API + '/messages');
            assert.deepStrictEqual(context.requests[0].params, { limit: 1, order_by: 'created_datetime:desc', ticket_id: 5 });
            assert.deepStrictEqual(context.sent[0].data, { id: 10 });
        });

        it('test() emits the newest ticket without writing state', async function() {
            const context = createContext({ responses: [{ data: { data: [{ id: 3 }] } }, { data: { id: 3, subject: 'x' } }] });
            await NewTicket.test(context);
            assert.strictEqual(context.requests[0].params.order_by, 'created_datetime:desc');
            assert.strictEqual(context.requests[1].url, API + '/tickets/3');
            assert.deepStrictEqual(context.sent, [{ data: { id: 3, subject: 'x' }, port: 'out' }]);
            assert.deepStrictEqual(context.state, {});
        });
    });

    describe('NewCustomer', function() {

        const page = (ids, nextCursor = null) => ({
            data: {
                data: ids.map(id => ({ id, created_datetime: `2026-11-20T10:00:${String(id).padStart(2, '0')}` })),
                meta: { next_cursor: nextCursor }
            }
        });

        it('records the existing customers on the first tick and emits only new ones later', async function() {
            const context = createContext({ responses: [page([2, 1]), page([4, 3, 2, 1])] });
            await NewCustomer.tick(context);
            assert.strictEqual(context.sent.length, 0);
            await NewCustomer.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [3, 4]);
            assert.deepStrictEqual(context.state.known, [4, 3, 2, 1]);
        });

        it('keeps the state when the answer is empty', async function() {
            const context = createContext({ state: { known: [2, 1] }, responses: [page([]), page([3, 2, 1])] });
            await NewCustomer.tick(context);
            assert.deepStrictEqual(context.state.known, [2, 1]);
            await NewCustomer.tick(context);
            assert.deepStrictEqual(context.sent.map(item => item.data.id), [3]);
        });

        it('does not fire an older customer pulled onto a full page', async function() {
            const context = createContext({ responses: [page([5, 4, 3], 'next'), page([5, 3, 2], 'next')] });
            await NewCustomer.tick(context);
            await NewCustomer.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });
    });
});
