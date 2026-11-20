'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const load = (name) => require(path.join(ROOT, 'core', name, name + '.js'));

class CancelError extends Error {}

const API = 'https://online2.superoffice.com/Cust12345/api/v1';

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { accessToken: '8A:Cust12345.token', tenantId: 'Cust12345' },
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

const notFound = () => Object.assign(new Error('404'), { response: { status: 404, data: { ErrorMessage: 'Not found' } } });

// The tenant time zone lookup every API call starts with; UTC unless a test routes it itself
const TIME_ZONE_PATH = '/Agents/TimeZone/GetDefaultTimeZoneInformation';

// Answers API calls by "METHOD /path" (the part after /api/v1); a function gets the request options.
const route = (context, routes) => {

    context.httpRequest.callsFake(async (options) => {
        if (options.url.includes('/api/state/')) {
            return { data: { IsRunning: true, State: 'Running', Api: API.replace(/\/v1$/, ''), ValidUntil: null } };
        }
        const key = (options.method || 'GET') + ' ' + options.url.slice(API.length);
        if (!(key in routes) && options.url.endsWith(TIME_ZONE_PATH)) {
            return { status: 200, headers: {}, data: { Bias: 0, Description: '!!!Timezones are not enabled' } };
        }
        if (!(key in routes)) {
            throw new Error('Unexpected request ' + key);
        }
        const answer = routes[key];
        const value = typeof answer === 'function' ? answer(options) : answer;
        if (value instanceof Error) {
            throw value;
        }
        return { status: 200, headers: {}, data: value };
    });
};

const apiCalls = (context) => context.httpRequest.getCalls()
    .map(call => call.args[0])
    .filter(options => !options.url.includes('/api/state/') && !options.url.endsWith(TIME_ZONE_PATH));

const ticketEntity = (overrides = {}) => ({
    TicketId: 7,
    Title: 'Login fails',
    BaseStatus: 'Active',
    Status: { TicketStatusId: 1, Name: 'Open' },
    Category: { TicketCategoryId: 3, Name: 'Login', Fullname: 'Support/Login' },
    Person: { PersonId: 342, FullName: 'Jane Doe', ContactId: 125, ContactName: 'Acme Inc.' },
    OwnedBy: { AssociateId: 5, Name: 'ANB', FullName: 'Anna Berg' },
    ClosedAt: '0001-01-01T00:00:00',
    CreatedAt: '2026-11-16T10:30:00',
    LastChanged: '2026-11-18T14:05:00',
    CustomFields: {
        'SuperOffice:1': '[I:9]',
        'SuperOffice:1:DisplayText': 'nine',
        'x_followup_sent': '[DT:11/18/2026 14:05:00.00000]',
        'x_comment': 'Great support'
    },
    ...overrides
});

describe('superoffice generic records', () => {

    describe('custom field values', () => {

        it('decodes the typed CustomFields strings', () => {

            assert.strictEqual(lib.decodeCustomValue('[I:23]'), 23);
            assert.strictEqual(lib.decodeCustomValue('[F:3.5]'), 3.5);
            assert.strictEqual(lib.decodeCustomValue('[D:06/19/2019]'), '2019-06-19');
            assert.strictEqual(lib.decodeCustomValue('[DT:06/19/2019 14:35:56.00000]'), '2019-06-19T14:35:56');
            assert.strictEqual(lib.decodeCustomValue('[I:]'), null);
            assert.strictEqual(lib.decodeCustomValue('plain text'), 'plain text');
        });

        it('encodes values by field type and passes encoded values through', () => {

            const context = createContext();
            assert.strictEqual(lib.encodeCustomValue(context, '9', 'Integer', 'Score'), '[I:9]');
            assert.strictEqual(lib.encodeCustomValue(context, true, 'Checkbox', 'Done'), '[I:1]');
            assert.strictEqual(lib.encodeCustomValue(context, 'false', 'Checkbox', 'Done'), '[I:0]');
            assert.strictEqual(lib.encodeCustomValue(context, 2.5, 'Decimal', 'Rate'), '[F:2.5]');
            assert.strictEqual(lib.encodeCustomValue(context, '2026-11-19', 'Date', 'Sent'), '[D:11/19/2026]');
            assert.strictEqual(lib.encodeCustomValue(context, '2026-11-19T08:05:09Z', 'DateTime', 'Sent'), '[DT:11/19/2026 08:05:09.00000]');
            assert.strictEqual(lib.encodeCustomValue(context, 'Thanks', 'ShortText', 'Comment'), 'Thanks');
            assert.strictEqual(lib.encodeCustomValue(context, '[I:4]', 'Integer', 'Score'), '[I:4]');
            assert.throws(() => lib.encodeCustomValue(context, 'abc', 'Integer', 'Score'), /Score must be a whole number/);
        });
    });

    describe('Get Record', () => {

        it('leaves out the placeholder owner of an unassigned ticket and the 0001 date of a record never updated', () => {

            const ticket = lib.toRecord('ticket', { TicketId: 1, OwnedBy: { AssociateId: 0, FullName: '[SR_CRITERION_UNASSIGNED]' } });
            assert.strictEqual(ticket.ownerId, undefined);
            assert.strictEqual(ticket.ownerName, undefined);

            const task = lib.toRecord('appointment', { AppointmentId: 14, UpdatedDate: '0001-01-01T00:00:00Z', Associate: { AssociateId: 3, FullName: 'Anna Berg' } });
            assert.strictEqual(task.updatedDate, undefined);
            assert.strictEqual(task.ownerName, 'Anna Berg');
        });

        it('maps a ticket with owner, status and custom fields', async () => {

            const context = createContext({ messages: { in: { content: { object: 'ticket', recordId: '7' } } } });
            route(context, { 'GET /Ticket/7': ticketEntity() });
            await load('GetRecord').receive(context);
            const record = context.sent[0].data;
            assert.strictEqual(record.object, 'ticket');
            assert.strictEqual(record.id, 7);
            assert.strictEqual(record.status, 'Active');
            assert.strictEqual(record.statusName, 'Open');
            assert.strictEqual(record.companyId, 125);
            assert.strictEqual(record.ownerId, 5);
            assert.strictEqual(record.ownerName, 'Anna Berg');
            assert.strictEqual(record.closedAt, undefined);
            assert.deepStrictEqual(record.customFields, {
                'SuperOffice:1': 9,
                'x_followup_sent': '2026-11-18T14:05:00',
                'x_comment': 'Great support'
            });
            assert.strictEqual(record.cf_SuperOffice_1, 9);
            assert.strictEqual(record.cf_x_comment, 'Great support');
        });

        it('builds the output options of the object without calling the API', async () => {

            const context = createContext({
                auth: undefined,
                properties: { generateOutputPortOptions: true },
                messages: { in: { content: { object: 'ticket', recordId: 'dummy' } } }
            });
            await load('GetRecord').receive(context);
            const values = context.sent[0].data.map(option => option.value);
            assert.ok(values.includes('statusName'));
            assert.ok(values.includes('ownerId'));
            assert.ok(values.includes('customFields'));
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('refuses an unknown object', async () => {

            const context = createContext({ messages: { in: { content: { object: 'invoice', recordId: '1' } } } });
            await assert.rejects(load('GetRecord').receive(context), /Object must be one of/);
        });
    });

    describe('Find Records', () => {

        it('filters the archive and reads every match in full', async () => {

            const context = createContext({ messages: { in: { content: { object: 'ticket', companyId: '125', outputType: 'array' } } } });
            route(context, {
                'GET /Ticket': (options) => {
                    assert.strictEqual(options.params.$filter, '(contactId eq 125)');
                    assert.strictEqual(options.params.$orderBy, 'ticketId desc');
                    assert.strictEqual(options.params.$top, 100);
                    return { value: [{ ticketId: '8' }, { ticketId: '7' }, { ticketId: '7' }] };
                },
                'GET /Ticket/8': notFound(),
                'GET /Ticket/7': ticketEntity()
            });
            await load('FindRecords').receive(context);
            assert.strictEqual(context.sent[0].port, 'out');
            assert.strictEqual(context.sent[0].data.count, 1);
            assert.strictEqual(context.sent[0].data.result[0].id, 7);
        });

        it('filters by owner in the archive query, not on the page it returned', async () => {

            const context = createContext({ messages: { in: { content: { object: 'ticket', ownerId: '9', outputType: 'array' } } } });
            route(context, { 'GET /Ticket': { value: [] } });
            await load('FindRecords').receive(context);
            assert.strictEqual(context.sent[0].port, 'notFound');
            assert.strictEqual(apiCalls(context)[0].params.$filter, '(ownedBy/associateDbId eq 9)');

            const companies = createContext({ messages: { in: { content: { object: 'company', ownerId: 5, outputType: 'array' } } } });
            route(companies, { 'GET /Contact': { value: [] } });
            await load('FindRecords').receive(companies);
            assert.strictEqual(apiCalls(companies)[0].params.$filter, '(associateId eq 5)');
        });

        it('refuses an owner filter on persons, which have no owner', async () => {

            const context = createContext({ messages: { in: { content: { object: 'person', ownerId: '9', outputType: 'array' } } } });
            await assert.rejects(load('FindRecords').receive(context), /have no owner to filter by/);
        });

        it('refuses a company filter on projects', async () => {

            const context = createContext({ messages: { in: { content: { object: 'project', companyId: '1', outputType: 'array' } } } });
            await assert.rejects(load('FindRecords').receive(context), /Company ID cannot filter/);
        });
    });

    describe('Record Updated', () => {

        const page = (rows) => ({
            value: rows.map(([id, updated]) => ({ ticketId: String(id), lastChanged: updated }))
        });

        it('records on the first tick and fires once per change afterwards', async () => {

            const trigger = load('RecordUpdated');
            let rows = [[7, '2026-11-18T14:05:00'], [6, '2026-11-18T13:00:00']];
            const context = createContext({ properties: { object: 'ticket' } });
            route(context, {
                'GET /Ticket': (options) => {
                    assert.strictEqual(options.params.$orderBy, 'lastChanged desc,ticketId desc');
                    assert.strictEqual(options.params.$select, 'ticketId,lastChanged');
                    return page(rows);
                },
                'GET /Ticket/6': ticketEntity({ TicketId: 6 })
            });

            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0);

            rows = [[6, '2026-11-19T09:00:00'], [7, '2026-11-18T14:05:00']];
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.id, 6);

            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 1, 'the same change must not fire twice');
        });

        it('keeps the state when the archive answers empty', async () => {

            const trigger = load('RecordUpdated');
            let rows = [[7, '2026-11-18T14:05:00']];
            const context = createContext({ properties: { object: 'ticket' } });
            route(context, { 'GET /Ticket': () => page(rows), 'GET /Ticket/7': ticketEntity() });
            await trigger.tick(context);
            rows = [];
            await trigger.tick(context);
            rows = [[7, '2026-11-18T14:05:00']];
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('does not fire for older records pulled onto a full page', async () => {

            const trigger = load('RecordUpdated');
            const size = lib.UPDATED_PAGE_SIZE;
            const full = Array.from({ length: size }, (_, i) => [
                1000 - i,
                new Date(Date.UTC(2026, 10, 18, 12, 0, size - i)).toISOString()
            ]);
            let rows = full;
            const context = createContext({ properties: { object: 'ticket' } });
            route(context, { 'GET /Ticket': () => page(rows) });
            await trigger.tick(context);
            // The newest record is deleted: an older one, never seen, moves onto the page.
            rows = full.slice(1).concat([[500, '2026-11-17T08:00:00']]);
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0);
        });

        it('fires "changes to" once when a ticket gets closed', async () => {

            const trigger = load('RecordUpdated');
            let rows = [[7, '2026-11-18T14:05:00']];
            let entity = ticketEntity();
            const context = createContext({
                properties: { object: 'ticket', conditionField: 'status', conditionOperator: 'changedTo', conditionValue: 'closed' }
            });
            route(context, { 'GET /Ticket': () => page(rows), 'GET /Ticket/7': () => entity });

            await trigger.tick(context);
            rows = [[7, '2026-11-18T15:00:00']];
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 0, 'still active');

            rows = [[7, '2026-11-18T16:00:00']];
            entity = ticketEntity({ BaseStatus: 'Closed' });
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 1);
            assert.strictEqual(context.sent[0].data.status, 'Closed');

            rows = [[7, '2026-11-18T17:00:00']];
            await trigger.tick(context);
            assert.strictEqual(context.sent.length, 1, 'an edit of a closed ticket is not a new close');
        });

        it('test() sends the most recently updated record without saving state', async () => {

            const context = createContext({ properties: { object: 'ticket' } });
            route(context, { 'GET /Ticket': page([[7, '2026-11-18T14:05:00']]), 'GET /Ticket/7': ticketEntity() });
            await load('RecordUpdated').test(context);
            assert.strictEqual(context.sent[0].data.id, 7);
            assert.strictEqual(context.getState(), undefined);
        });
    });

    describe('Update Record', () => {

        const fieldInfos = [
            { FieldName: 'SuperOffice:1', DisplayName: 'US:"NPS Score";NO:"NPS"', FieldType: 'Integer', Rank: 1 },
            { FieldName: 'x_followup_sent', DisplayName: 'Survey Sent', FieldType: 'Date', Rank: 2 },
            { FieldName: 'x_locked', DisplayName: 'Locked', FieldType: 'ShortText', IsReadOnly: true, Rank: 3 }
        ];

        it('saves standard fields with PUT and custom fields with PATCH', async () => {

            const context = createContext({
                messages: { in: { content: {
                    object: 'ticket',
                    recordId: '7',
                    title: 'Login fixed',
                    ownerId: '6',
                    cf_SuperOffice_1: '10',
                    customFieldsJson: '{"x_followup_sent": "2026-11-19"}'
                } } }
            });
            route(context, {
                'GET /Ticket/7': ticketEntity(),
                'PUT /Ticket/7': {},
                'GET /Ticket/CustomField': fieldInfos,
                'PATCH /Ticket/7': {}
            });
            await load('UpdateRecord').receive(context);
            const calls = apiCalls(context);
            const put = calls.find(call => call.method === 'PUT');
            assert.strictEqual(put.data.Title, 'Login fixed');
            assert.deepStrictEqual(put.data.OwnedBy, { AssociateId: 6 });
            const patch = calls.find(call => call.method === 'PATCH');
            assert.deepStrictEqual(patch.data, [{
                op: 'replace',
                path: 'CustomFields',
                value: { 'SuperOffice:1': '[I:10]', 'x_followup_sent': '[D:11/19/2026]' }
            }]);
            assert.deepStrictEqual(context.sent[0], { data: {}, port: 'out' });
        });

        it('only patches when no standard field is set', async () => {

            const context = createContext({ messages: { in: { content: { object: 'person', recordId: '3', cf_SuperOffice_1: 4 } } } });
            route(context, { 'GET /Person/CustomField': fieldInfos, 'PATCH /Person/3': {} });
            await load('UpdateRecord').receive(context);
            assert.deepStrictEqual(apiCalls(context).map(call => call.method || 'GET'), ['GET', 'PATCH']);
        });

        it('refuses an update without fields and unknown custom fields', async () => {

            const empty = createContext({ messages: { in: { content: { object: 'ticket', recordId: '7' } } } });
            await assert.rejects(load('UpdateRecord').receive(empty), /Set at least one field/);

            const unknown = createContext({ messages: { in: { content: { object: 'ticket', recordId: '7', cf_nope: 'x' } } } });
            route(unknown, { 'GET /Ticket/CustomField': fieldInfos });
            await assert.rejects(load('UpdateRecord').receive(unknown), /Unknown custom field cf_nope/);
        });

        it('offers the ticket statuses with the object on the in port of List Statuses', async () => {

            const context = createContext({ properties: { generateInspector: true, object: 'ticket' } });
            route(context, { 'GET /Ticket/CustomField': [] });
            await load('UpdateRecord').receive(context);
            const { source } = context.sent[0].data.inputs.statusId;
            assert.strictEqual(source.data.messages['in/object'], 'ticket');
            assert.strictEqual(source.data.properties.isSource, true);
        });

        it('generates the inspector with the writable custom fields of the object', async () => {

            const context = createContext({ properties: { generateInspector: true, object: 'ticket' } });
            route(context, { 'GET /Ticket/CustomField': fieldInfos });
            await load('UpdateRecord').receive(context);
            const { inputs, schema } = context.sent[0].data;
            assert.ok(inputs.statusId.source);
            assert.ok(inputs.ownerId.source);
            assert.strictEqual(inputs.cf_SuperOffice_1.label, 'NPS Score');
            assert.strictEqual(inputs.cf_SuperOffice_1.type, 'number');
            assert.strictEqual(inputs.cf_x_followup_sent.type, 'date-time');
            assert.strictEqual(inputs.cf_x_locked, undefined);
            assert.deepStrictEqual(schema.required, ['object', 'recordId']);
        });

        it('offers only the common inputs when the object is a variable', async () => {

            const context = createContext({ properties: { generateInspector: true, object: '{{{abc}}}' } });
            await load('UpdateRecord').receive(context);
            assert.deepStrictEqual(Object.keys(context.sent[0].data.inputs), ['object', 'recordId', 'customFieldsJson', 'timeZone']);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });
    });

    describe('Create Task and Create Note', () => {

        it('creates a task assigned to a user and linked to a ticket', async () => {

            const context = createContext({ messages: { in: { content: {
                title: 'Call about the survey',
                dueDate: '2026-11-20T09:00:00Z',
                assigneeId: '6',
                ticketId: '7',
                companyId: '125'
            } } } });
            route(context, {
                'GET /Appointment/default': { Associate: { AssociateId: 1 }, Type: 'inDiary' },
                'POST /Appointment': (options) => ({ ...options.data, AppointmentId: 99 })
            });
            await load('CreateTask').receive(context);
            const post = apiCalls(context).find(call => call.method === 'POST');
            assert.deepStrictEqual(post.data.Associate, { AssociateId: 6 });
            assert.deepStrictEqual(post.data.Ticket, { TicketId: 7 });
            assert.deepStrictEqual(post.data.Contact, { ContactId: 125 });
            assert.strictEqual(post.data.Type, 'inChecklist');
            // The tenant of the tests is on UTC: the wall clock SuperOffice stores equals the instant
            assert.strictEqual(post.data.StartDate, '2026-11-20T09:00:00');
            assert.strictEqual(post.data.EndDate, '2026-11-20T09:00:00');
            const record = context.sent[0].data;
            assert.strictEqual(record.id, 99);
            assert.strictEqual(record.ticketId, 7);
            assert.strictEqual(record.ownerId, 6);
        });

        it('creates a note as a completed task and requires a link', async () => {

            const unlinked = createContext({ messages: { in: { content: { title: 'Feedback' } } } });
            await assert.rejects(load('CreateNote').receive(unlinked), /Link the note/);

            const context = createContext({ messages: { in: { content: { title: 'Feedback', text: 'Score 9', ticketId: '7' } } } });
            route(context, {
                'GET /Appointment/default': {},
                'POST /Appointment': (options) => ({ ...options.data, AppointmentId: 100 })
            });
            await load('CreateNote').receive(context);
            const post = apiCalls(context).find(call => call.method === 'POST');
            assert.strictEqual(post.data.Completed, 'Completed');
            assert.strictEqual(post.data.Title, 'Feedback');
            assert.strictEqual(post.data.Agenda, 'Score 9');
        });
    });

    describe('lookups', () => {

        it('lists users from the associate MDO list', async () => {

            const context = createContext({ messages: { in: { content: { outputType: 'array' } } } });
            route(context, {
                'GET /MDOList/associate': (options) => {
                    assert.strictEqual(options.params.flat, true);
                    return [{ Id: 5, Name: 'Anna Berg' }, { Id: -1, Name: 'Heading' }, { Id: 6, Name: 'Old', Deleted: true }];
                }
            });
            await load('ListUsers').receive(context);
            assert.deepStrictEqual(context.sent[0].data, { result: [{ id: 5, name: 'Anna Berg' }], count: 1 });
        });

        it('lists ticket statuses and fields of an object', async () => {

            const statuses = createContext({ messages: { in: { content: { object: 'ticket', outputType: 'array' } } } });
            // The tenant's ticket statuses; the MDO list "ticketstatus" holds base statuses under other IDs
            route(statuses, {
                'GET /List/TicketStatus/Items': [
                    { TicketStatusId: 2, Name: 'Open', Status: 'Active' },
                    { TicketStatusId: 3, Name: 'Closed', Status: 'Closed' }
                ]
            });
            await load('ListStatuses').receive(statuses);
            assert.deepStrictEqual(statuses.sent[0].data.result, [{ id: '2', name: 'Open' }, { id: '3', name: 'Closed' }]);

            const fields = createContext({ messages: { in: { content: { object: 'ticket', outputType: 'array' } } } });
            route(fields, { 'GET /Ticket/CustomField': [{ FieldName: 'x_score', DisplayName: 'Score', FieldType: 'Integer' }] });
            await load('ListFields').receive(fields);
            const keys = fields.sent[0].data.result.map(field => field.key);
            assert.ok(keys.includes('status'));
            assert.ok(keys.includes('cf_x_score'));
        });

        it('returns no options instead of failing as a dropdown source', async () => {

            const context = createContext({ properties: { isSource: true }, messages: { in: { content: {} } } });
            route(context, { 'GET /MDOList/associate': notFound() });
            await load('ListUsers').receive(context);
            assert.deepStrictEqual(context.sent[0].data, { result: [], count: 0 });
        });
    });

    describe('time zone', () => {

        const WINTER = Date.UTC(2026, 10, 20, 8, 0, 0);
        const SUMMER = Date.UTC(2026, 6, 1, 8, 0, 0);
        const appointment = (dates) => ({ AppointmentId: 14, Description: 'Call', Associate: { AssociateId: 3 }, ...dates });
        // A UTC+1 tenant without time zones enabled, as SuperOffice reports it in winter
        const tenant = (routes) => ({ 'POST /Agents/TimeZone/GetDefaultTimeZoneInformation': { Bias: 60, Description: '!!!Timezones are not enabled' }, ...routes });

        it('takes a European offset as the European zone that has it now, any other offset as it is', () => {

            assert.deepStrictEqual(lib.timeZoneForBias(60, WINTER), { zone: 'Europe/Oslo' });
            assert.deepStrictEqual(lib.timeZoneForBias(60, SUMMER), { zone: 'Europe/London' });
            assert.deepStrictEqual(lib.timeZoneForBias(120, SUMMER), { zone: 'Europe/Oslo' });
            assert.deepStrictEqual(lib.timeZoneForBias(0, WINTER), { zone: 'Europe/London' });
            assert.deepStrictEqual(lib.timeZoneForBias(330, WINTER), { bias: 330 });
            assert.deepStrictEqual(lib.timeZoneForBias(-300, WINTER), { bias: -300 });
        });

        it('turns the tenant wall clock into UTC, also across the daylight saving switch', () => {

            const oslo = { zone: 'Europe/Oslo' };
            assert.strictEqual(lib.toUtc(oslo, '2026-12-01T13:00:00'), '2026-12-01T12:00:00Z');
            assert.strictEqual(lib.toUtc(oslo, '2026-07-01T14:00:00'), '2026-07-01T12:00:00Z');
            // The switch nights: 01:59:59 is still winter time, 03:00 already summer time
            assert.strictEqual(lib.toUtc(oslo, '2026-03-29T01:59:59'), '2026-03-29T00:59:59Z');
            assert.strictEqual(lib.toUtc(oslo, '2026-03-29T03:00:00'), '2026-03-29T01:00:00Z');
            assert.strictEqual(lib.toUtc(oslo, '2026-10-25T03:00:00'), '2026-10-25T02:00:00Z');
            assert.strictEqual(lib.toUtc({ bias: 330 }, '2026-07-01T17:30:00'), '2026-07-01T12:00:00Z');
            // An offset in the value wins; no date and the 0001 placeholder stay as they are
            assert.strictEqual(lib.toUtc(oslo, '2026-12-01T12:00:00+01:00'), '2026-12-01T11:00:00Z');
            assert.strictEqual(lib.toUtc(oslo, '0001-01-01T00:00:00'), '0001-01-01T00:00:00');
            assert.strictEqual(lib.toUtc(oslo, undefined), undefined);
        });

        it('sends an instant as the wall clock of a UTC+1 tenant and returns UTC', async () => {

            const clock = sinon.useFakeTimers({ now: WINTER, toFake: ['Date'] });
            try {
                const context = createContext({ messages: { in: { content: {
                    title: 'Call', dueDate: '2026-12-01T12:00:00Z', endDate: '2026-07-01T12:00:00+02:00'
                } } } });
                let posted;
                route(context, tenant({
                    'GET /Appointment/default': appointment({ AppointmentId: 0 }),
                    'POST /Appointment': (options) => {
                        posted = options.data;
                        return appointment({ StartDate: options.data.StartDate, EndDate: options.data.EndDate, CreatedDate: '2026-11-20T09:00:00' });
                    }
                }));
                await load('CreateTask').receive(context);
                // 12:00 UTC is 13:00 in winter; 10:00 UTC is 12:00 in summer, although it is winter now
                assert.strictEqual(posted.StartDate, '2026-12-01T13:00:00');
                assert.strictEqual(posted.EndDate, '2026-07-01T12:00:00');
                const out = context.sent[0].data;
                assert.strictEqual(out.startDate, '2026-12-01T12:00:00Z');
                assert.strictEqual(out.endDate, '2026-07-01T10:00:00Z');
                assert.strictEqual(out.createdDate, '2026-11-20T08:00:00Z');
            } finally {
                clock.restore();
            }
        });

        it('takes a date without an offset as the wall clock of the tenant, whatever the server time zone', async () => {

            const context = createContext({ messages: { in: { content: { title: 'Call', dueDate: '2026-12-01 09:30', endDate: '2026-12-02' } } } });
            let posted;
            route(context, tenant({
                'GET /Appointment/default': appointment({ AppointmentId: 0 }),
                'POST /Appointment': (options) => {
                    posted = options.data;
                    return appointment({});
                }
            }));
            await load('CreateTask').receive(context);
            assert.strictEqual(posted.StartDate, '2026-12-01T09:30:00');
            assert.strictEqual(posted.EndDate, '2026-12-02T00:00:00');
        });

        it('uses the configured time zone without asking SuperOffice, and asks once otherwise', async () => {

            const lookups = (context) => context.httpRequest.getCalls()
                .filter(call => call.args[0].url.endsWith(TIME_ZONE_PATH)).length;
            const configured = createContext({ config: { timeZone: 'America/New_York' }, messages: { in: { content: { object: 'appointment', recordId: '14' } } } });
            route(configured, { 'GET /Appointment/14': appointment({ StartDate: '2026-12-01T07:00:00' }) });
            await load('GetRecord').receive(configured);
            assert.strictEqual(configured.sent[0].data.startDate, '2026-12-01T12:00:00Z');
            assert.strictEqual(lookups(configured), 0);

            const asked = createContext({ messages: { in: { content: { object: 'appointment', recordId: '14' } } } });
            route(asked, tenant({ 'GET /Appointment/14': appointment({ StartDate: '2026-12-01T13:00:00' }) }));
            await load('GetRecord').receive(asked);
            await load('GetRecord').receive(asked);
            assert.strictEqual(lookups(asked), 1);

            const wrong = createContext({ config: { timeZone: 'Mars/Olympus' }, messages: { in: { content: { object: 'appointment', recordId: '14' } } } });
            await assert.rejects(load('GetRecord').receive(wrong), /Unsupported SuperOffice time zone/);
        });

        it('lets the Time Zone input of the component win over the config and the detected zone', async () => {

            const lookups = (context) => context.httpRequest.getCalls()
                .filter(call => call.args[0].url.endsWith(TIME_ZONE_PATH)).length;
            const context = createContext({
                config: { timeZone: 'Europe/Oslo' },
                messages: { in: { content: { title: 'Call', dueDate: '2026-12-01T12:00:00Z', timeZone: 'America/New_York' } } }
            });
            let posted;
            route(context, tenant({
                'GET /Appointment/default': appointment({ AppointmentId: 0 }),
                'POST /Appointment': (options) => {
                    posted = options.data;
                    return appointment({ StartDate: options.data.StartDate });
                }
            }));
            await load('CreateTask').receive(context);
            assert.strictEqual(posted.StartDate, '2026-12-01T07:00:00');
            assert.strictEqual(posted.timeZone, undefined);
            assert.strictEqual(context.sent[0].data.startDate, '2026-12-01T12:00:00Z');
            assert.strictEqual(lookups(context), 0);

            // A trigger takes it as a property
            const trigger = createContext({ properties: { object: 'appointment', timeZone: 'Asia/Kolkata' } });
            route(trigger, tenant({
                'GET /Appointment': { value: [{ appointmentId: 14, updatedDate: '2026-12-01T17:30:00' }] },
                'GET /Appointment/14': appointment({ StartDate: '2026-12-01T17:30:00' })
            }));
            await load('RecordUpdated').test(trigger);
            assert.strictEqual(trigger.sent[0].data.startDate, '2026-12-01T12:00:00Z');

            const wrong = createContext({ messages: { in: { content: { object: 'appointment', recordId: '14', timeZone: 'Oslo' } } } });
            await assert.rejects(load('GetRecord').receive(wrong), (err) => err instanceof CancelError && /is not a time zone name/.test(err.message));
        });

        it('lists the time zones for the dropdown, UTC and Europe/Oslo among them', async () => {

            const context = createContext();
            const component = load('ListTimeZones');
            await component.receive(context);
            const { result, count } = context.sent[0].data;
            assert.strictEqual(count, result.length);
            assert.ok(count > 300);
            const names = result.map(item => item.name);
            assert.ok(names.includes('UTC'));
            assert.ok(names.includes('Europe/Oslo'));
            assert.strictEqual(new Set(names).size, names.length);
            assert.strictEqual(result.find(item => item.name === 'UTC').label, '(UTC+00:00) UTC');
            assert.match(result.find(item => item.name === 'America/New_York').label, /^\(UTC-0[45]:00\) America\/New_York$/);
            // Ordered by offset: the westernmost zone first, the easternmost last
            assert.match(result[0].label, /^\(UTC-1[12]:00\)/);
            assert.match(result[result.length - 1].label, /^\(UTC\+1[34]:00\)/);
            assert.deepStrictEqual(component.toSelectArray({ result: [{ name: 'UTC', label: '(UTC+00:00) UTC' }] }), [{ label: '(UTC+00:00) UTC', value: 'UTC' }]);
            assert.strictEqual(context.httpRequest.callCount, 0);
        });

        it('fails instead of guessing when SuperOffice does not report the time zone', async () => {

            const context = createContext({ messages: { in: { content: { object: 'appointment', recordId: '14' } } } });
            route(context, { 'POST /Agents/TimeZone/GetDefaultTimeZoneInformation': {}, 'GET /Appointment/14': appointment({}) });
            await assert.rejects(load('GetRecord').receive(context), /did not report the time zone/);
        });
    });
});
