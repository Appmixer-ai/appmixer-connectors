'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const sinon = require('sinon');

const ROOT = path.join(__dirname, '../..');
const lib = require(path.join(ROOT, 'lib.js'));
const load = (name) => require(path.join(ROOT, 'core', name, name + '.js'));

class CancelError extends Error {}

const createContext = (overrides = {}) => {

    let state = overrides.state;
    const sent = [];
    const context = {
        auth: { apiKey: 'cal_test_key' },
        config: {},
        properties: {},
        componentId: 'component-1',
        messages: { in: { content: {} } },
        CancelError,
        httpRequest: sinon.stub(),
        sendJson: sinon.stub().callsFake(async (data, port) => sent.push({ data, port })),
        response: sinon.stub().resolves(),
        getWebhookUrl: () => 'https://api.appmixer.example/flows/1/components/2',
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

const sign = (secret, body) => crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

describe('appmixer.calcom', function() {

    afterEach(() => sinon.restore());

    describe('lib.request', function() {

        it('sends the API key as a Bearer token and the cal-api-version header', async function() {

            const context = createContext();
            context.httpRequest.resolves({ data: { status: 'success', data: { id: 1 } } });

            await lib.request(context, { path: '/v2/bookings/abc', version: '2026-02-25' });

            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.cal.com/v2/bookings/abc');
            assert.strictEqual(options.headers.Authorization, 'Bearer cal_test_key');
            assert.strictEqual(options.headers['cal-api-version'], '2026-02-25');
        });

        it('turns a Cal.com client error into a CancelError with its message', async function() {

            const context = createContext();
            const err = new Error('Request failed with status code 400');
            err.response = { status: 400, data: { status: 'error', error: { code: 'BadRequestException', message: 'No available users found.' } } };
            context.httpRequest.rejects(err);

            await assert.rejects(
                lib.request(context, { path: '/v2/bookings', method: 'POST', data: {} }),
                (e) => e instanceof CancelError && /No available users found/.test(e.message)
            );
        });

        it('keeps a rate limit error retryable', async function() {

            const context = createContext();
            const err = new Error('Request failed with status code 429');
            err.response = { status: 429, data: {} };
            context.httpRequest.rejects(err);

            await assert.rejects(lib.request(context, { path: '/v2/me' }), (e) => !(e instanceof CancelError));
        });
    });

    describe('MakeApiCall', function() {

        it('rejects a URL on another host without making a request', async function() {

            const context = createContext({
                messages: { in: { content: { url: 'https://evil.example/v2/me', method: 'GET' } } }
            });

            await assert.rejects(load('MakeApiCall').receive(context), CancelError);
            await assert.rejects(
                load('MakeApiCall').receive(createContext({ messages: { in: { content: { url: '//evil.example/x', method: 'GET' } } } })),
                CancelError
            );
            sinon.assert.notCalled(context.httpRequest);
        });

        it('resolves a path against api.cal.com and keeps the headers set in the Designer', async function() {

            const context = createContext({
                messages: {
                    in: {
                        content: {
                            url: '/v2/bookings',
                            method: 'GET',
                            headers: '{"cal-api-version": "2026-05-01"}',
                            parameters: '{"status": "upcoming"}'
                        }
                    }
                }
            });
            context.httpRequest.resolves({ status: 200, headers: {}, data: { status: 'success', data: [] } });

            await load('MakeApiCall').receive(context);

            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.url, 'https://api.cal.com/v2/bookings');
            assert.strictEqual(options.headers['cal-api-version'], '2026-05-01');
            assert.strictEqual(options.headers.Authorization, 'Bearer cal_test_key');
            assert.deepStrictEqual(options.params, { status: 'upcoming' });
            assert.strictEqual(context.sent[0].data.statusCode, 200);
        });
    });

    describe('CreateBooking', function() {

        it('sends the event type as a number, the start in UTC and the guests as a list', async function() {

            const context = createContext({
                messages: {
                    in: {
                        content: {
                            eventTypeId: '123',
                            start: '2026-12-01T10:00:00+01:00',
                            attendeeName: 'John Smith',
                            attendeeEmail: 'john@example.com',
                            attendeeTimeZone: 'Europe/Prague',
                            guests: 'a@example.com, b@example.com'
                        }
                    }
                }
            });
            context.httpRequest.resolves({ data: { status: 'success', data: { uid: 'uid-1', status: 'accepted' } } });

            await load('CreateBooking').receive(context);

            const options = context.httpRequest.firstCall.args[0];
            assert.strictEqual(options.headers['cal-api-version'], '2026-02-25');
            assert.deepStrictEqual(options.data, {
                eventTypeId: 123,
                start: '2026-12-01T09:00:00.000Z',
                attendee: { name: 'John Smith', email: 'john@example.com', timeZone: 'Europe/Prague' },
                guests: ['a@example.com', 'b@example.com']
            });
            assert.strictEqual(context.sent[0].data.uid, 'uid-1');
        });

        it('returns the first occurrence of a recurring booking', async function() {

            const context = createContext({
                messages: { in: { content: { eventTypeId: '1', start: '2026-12-01T09:00:00Z', attendeeName: 'J', attendeeTimeZone: 'UTC' } } }
            });
            context.httpRequest.resolves({ data: { status: 'success', data: [{ uid: 'first' }, { uid: 'second' }] } });

            await load('CreateBooking').receive(context);

            assert.strictEqual(context.sent[0].data.uid, 'first');
        });
    });

    describe('FindAvailableSlots', function() {

        it('flattens the slots grouped by day in time order', function() {

            const slots = load('FindAvailableSlots').flattenSlots({
                '2026-12-02': [{ start: '2026-12-02T09:00:00.000Z', end: '2026-12-02T09:30:00.000Z' }],
                '2026-12-01': [{ start: '2026-12-01T09:00:00.000Z', end: '2026-12-01T09:30:00.000Z' }]
            });

            assert.deepStrictEqual(slots.map(slot => slot.date), ['2026-12-01', '2026-12-02']);
            assert.strictEqual(slots[0].start, '2026-12-01T09:00:00.000Z');
        });

        it('sends nothing but notFound when there is no free slot', async function() {

            const context = createContext({
                messages: { in: { content: { eventTypeId: '1', start: '2026-12-01', end: '2026-12-02', outputType: 'first' } } }
            });
            context.httpRequest.resolves({ data: { status: 'success', data: {} } });

            await load('FindAvailableSlots').receive(context);

            assert.deepStrictEqual(context.sent, [{ data: {}, port: 'notFound' }]);
            assert.strictEqual(context.httpRequest.firstCall.args[0].params.format, 'range');
        });
    });

    describe('webhook triggers', function() {

        it('registers one trigger event with a secret on start and deletes the webhook on stop', async function() {

            const context = createContext();
            context.httpRequest.onFirstCall().resolves({ data: { status: 'success', data: { id: 77 } } });
            context.httpRequest.onSecondCall().resolves({ data: { status: 'success' } });

            await load('BookingCreated').start(context);

            const register = context.httpRequest.firstCall.args[0];
            assert.strictEqual(register.method, 'POST');
            assert.strictEqual(register.url, 'https://api.cal.com/v2/webhooks');
            assert.deepStrictEqual(register.data.triggers, ['BOOKING_CREATED']);
            assert.strictEqual(register.data.subscriberUrl, 'https://api.appmixer.example/flows/1/components/2');
            assert.strictEqual(register.data.version, '2021-10-20');
            assert.strictEqual(context.getState().secret, register.data.secret);
            assert.strictEqual(context.getState().webhookId, '77');

            await load('BookingCreated').stop(context);

            const remove = context.httpRequest.secondCall.args[0];
            assert.strictEqual(remove.method, 'DELETE');
            assert.strictEqual(remove.url, 'https://api.cal.com/v2/webhooks/77');
        });

        it('rejects a delivery without a valid signature and emits nothing', async function() {

            const body = { triggerEvent: 'BOOKING_CREATED', createdAt: '2026-11-16T10:00:00.000Z', payload: { uid: 'u1' } };
            const context = createContext({
                state: { secret: 'secret-1' },
                messages: { webhook: { content: { data: body, headers: { 'x-cal-signature-256': sign('other', body) } } } }
            });

            await load('BookingCreated').receive(context);

            assert.strictEqual(context.sent.length, 0);
            assert.strictEqual(context.response.firstCall.args[1], 401);
        });

        it('emits a signed booking event flattened, once per delivery', async function() {

            const body = { triggerEvent: 'BOOKING_CANCELLED', createdAt: '2026-11-16T10:00:00.000Z', payload: { uid: 'u1', bookingId: 5, cancellationReason: 'No time' } };
            const content = { data: body, headers: { 'x-cal-signature-256': sign('secret-1', body) } };
            const context = createContext({ state: { secret: 'secret-1' }, messages: { webhook: { content } } });

            await load('BookingCancelled').receive(context);
            await load('BookingCancelled').receive(context);

            assert.strictEqual(context.sent.length, 1);
            assert.deepStrictEqual(context.sent[0].data, {
                triggerEvent: 'BOOKING_CANCELLED',
                createdAt: '2026-11-16T10:00:00.000Z',
                uid: 'u1',
                bookingId: 5,
                cancellationReason: 'No time'
            });
        });

        it('passes the flat MEETING_ENDED payload through and ignores other events', async function() {

            const ended = { triggerEvent: 'MEETING_ENDED', id: 5, uid: 'u1', idempotencyKey: 'k1', endTime: '2026-12-01T09:30:00.000Z' };
            const context = createContext({
                state: { secret: 's' },
                messages: { webhook: { content: { data: ended, headers: { 'x-cal-signature-256': sign('s', ended) } } } }
            });
            await load('MeetingEnded').receive(context);
            assert.deepStrictEqual(context.sent[0].data, ended);

            const other = createContext({
                state: { secret: 's' },
                messages: { webhook: { content: { data: ended, headers: { 'x-cal-signature-256': sign('s', ended) } } } }
            });
            await load('BookingCreated').receive(other);
            assert.strictEqual(other.sent.length, 0);
        });

        it('test() emits the newest booking in the webhook shape and throws when there is none', async function() {

            const booking = {
                id: 5, uid: 'u1', title: 'Intro', start: '2026-12-01T09:00:00.000Z', end: '2026-12-01T09:30:00.000Z',
                status: 'accepted', eventTypeId: 9, createdAt: '2026-11-16T10:00:00.000Z', duration: 30,
                hosts: [{ id: 1, name: 'Jane', email: 'jane@example.com', username: 'jane', timeZone: 'UTC' }],
                attendees: [{ name: 'John', email: 'john@example.com', timeZone: 'UTC', absent: false }]
            };
            const context = createContext();
            context.httpRequest.resolves({ data: { status: 'success', data: [booking] } });

            await load('BookingCreated').test(context);

            const event = context.sent[0].data;
            assert.strictEqual(event.triggerEvent, 'BOOKING_CREATED');
            assert.strictEqual(event.bookingId, 5);
            assert.strictEqual(event.startTime, booking.start);
            assert.strictEqual(event.status, 'ACCEPTED');
            assert.strictEqual(event.organizer.email, 'jane@example.com');
            assert.deepStrictEqual(event.attendees, [{ name: 'John', email: 'john@example.com', timeZone: 'UTC' }]);
            sinon.assert.calledWithMatch(context.httpRequest, { method: 'GET' });

            const empty = createContext();
            empty.httpRequest.resolves({ data: { status: 'success', data: [] } });
            await assert.rejects(load('BookingCreated').test(empty), CancelError);
        });
    });
});
