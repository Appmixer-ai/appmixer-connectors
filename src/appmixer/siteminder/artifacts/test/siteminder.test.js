'use strict';

/* eslint-disable max-len */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const lib = require('../../lib');
const soap = require('../../soap');
const auth = require('../../auth');
const routes = require('../../routes');

const FindPublishers = require('../../core/FindPublishers/FindPublishers');
const FindHotels = require('../../core/FindHotels/FindHotels');
const FindRoomTypes = require('../../core/FindRoomTypes/FindRoomTypes');
const FindRatePlans = require('../../core/FindRatePlans/FindRatePlans');
const GetRoomType = require('../../core/GetRoomType/GetRoomType');
const GetRatePlan = require('../../core/GetRatePlan/GetRatePlan');
const FindRoomTypeAvailability = require('../../core/FindRoomTypeAvailability/FindRoomTypeAvailability');
const FindRatePlanAvailability = require('../../core/FindRatePlanAvailability/FindRatePlanAvailability');
const FindRates = require('../../core/FindRates/FindRates');
const MakeApiCall = require('../../core/MakeApiCall/MakeApiCall');
const NewReservationMessage = require('../../core/NewReservationMessage/NewReservationMessage');
const NewReservation = require('../../core/NewReservation/NewReservation');
const UpdatedReservation = require('../../core/UpdatedReservation/UpdatedReservation');
const CancelledReservation = require('../../core/CancelledReservation/CancelledReservation');

class CancelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CancelError';
    }
}

class InvalidTokenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTokenError';
    }
}

const PRODUCTION = 'https://exchange-api.siteminder.com';
const PREPRODUCTION = 'https://tpi-subscriberx.preprod.siteminderlabs.com';

// Messages copied from SiteMinder's documentation
// (https://developer.siteminder.com/smx-api/reference/reservations, .../guides/quick-start,
// .../guides/error-handling). Their credentials are the literal USERNAME / PASSWORD.
const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
const MINIMUM = fixture('reservation-minimum-content.xml');
const MAXIMUM = fixture('reservation-maximum-content.xml');
const CANCELLATION = fixture('reservation-minimum-cancellation.xml');
const QUICK_START = fixture('reservation-quick-start.xml');

// An endpoint password that passes SiteMinder's password policy. The documentation samples use
// "PASSWORD", which the account form refuses, so listeners in these tests are built from hashes.
const STRONG_PASSWORD = 'MyP@ssw0rd2024!Secure';
const ACCOUNT = { environment: 'production', apiToken: 'token-1', soapUsername: 'appmixer-smx', soapPassword: STRONG_PASSWORD };

// A response that is an Error makes httpRequest reject with it. A function is called with the request.
const createContext = ({ auth: account = ACCOUNT, content = {}, properties = {}, responses = [], webhook } = {}) => {

    const context = {
        auth: account,
        config: {},
        properties,
        componentId: 'component-1',
        flowId: 'flow-1',
        flowDescriptor: { 'component-1': { label: 'Find' } },
        messages: webhook ? { webhook: { content: { data: webhook } } } : { in: { content } },
        CancelError,
        requests: [],
        sent: [],
        logs: [],
        files: [],
        cache: {},
        listeners: [],
        removed: [],
        async httpRequest(options) {
            this.requests.push(options);
            let next = responses.length ? responses.shift() : { data: {} };
            if (typeof next === 'function') {
                next = next(options);
            }
            if (next instanceof Error) {
                throw next;
            }
            return { status: 200, headers: {}, ...next };
        },
        async sendJson(data, port) {
            this.sent.push({ data, port });
        },
        async log(entry) {
            this.logs.push(entry);
        },
        async lock() {
            return { async unlock() {} };
        },
        staticCache: {
            get: async key => context.cache[key],
            set: async (key, value, ttl) => {
                context.cache[key] = value;
                context.cacheTtl = ttl;
            }
        },
        async saveFileStream(name, buffer) {
            this.files.push({ name, content: buffer.toString('utf8') });
            return { fileId: 'file-1' };
        },
        async addListener(eventName, params) {
            this.listeners.push({ eventName, params });
        },
        async removeListener(eventName) {
            this.removed.push(eventName);
        }
    };
    return context;
};

// The context auth.js callbacks get: the fields sit on the context, there is no "auth" and no CancelError.
const createAuthContext = (fields, responses = []) => ({
    ...fields,
    InvalidTokenError,
    requests: [],
    async httpRequest(options) {
        this.requests.push(options);
        const next = responses.length ? responses.shift() : { data: [] };
        if (next instanceof Error) {
            throw next;
        }
        return { status: 200, headers: {}, ...next };
    }
});

const httpError = (status, data, headers = {}) => Object.assign(new Error('Request failed with status code ' + status), {
    response: { status, data, headers }
});

const listener = (username, password, hotelCodes, url = 'https://appmixer.example/flows/f/components/c') => ({
    eventName: lib.RESERVATION_EVENT,
    url,
    params: { credentialHash: lib.credentialHash(username, password), hotelCodes }
});

// The plugin context of routes.js. triggerListeners applies the filter the way the engine does.
const createPluginContext = (listeners = []) => {

    const context = {
        listeners,
        delivered: [],
        logs: [],
        registered: [],
        listenerCallbacks: [],
        failDelivery: null,
        async getListeners(eventName, filter) {
            const found = this.listeners.filter(item => item.eventName === eventName);
            return filter ? found.filter(filter) : found;
        },
        async triggerListeners({ eventName, payload, filter }) {
            if (this.failDelivery) {
                throw this.failDelivery;
            }
            const targets = await this.getListeners(eventName, filter);
            this.delivered.push({ eventName, payload, urls: targets.map(item => item.url) });
        },
        onListenerAdded(callback) {
            this.listenerCallbacks.push(callback);
        },
        async log(level, message, data) {
            this.logs.push({ level, message, data });
        },
        http: {
            router: {
                register(route) {
                    context.registered.push(route);
                }
            }
        }
    };
    return context;
};

// The body of an OTA response without what changes from message to message.
const responseBody = (xml) => {

    const body = soap.parseXml(xml).Envelope.Body;
    const response = body.OTA_HotelResNotifRS;
    if (response) {
        delete response['@_TimeStamp'];
        delete response['@_EchoToken'];
    }
    return body;
};

const withCredentials = (xml, username, password) => xml
    .replace('<wsse:Username>USERNAME</wsse:Username>', `<wsse:Username>${username}</wsse:Username>`)
    .replace('>PASSWORD</wsse:Password>', `>${password}</wsse:Password>`);

describe('siteminder', () => {

    describe('reservation endpoint (SOAP)', () => {

        it('accepts a valid push, answers the documented success message and delivers it to the hotel\'s flow', async () => {

            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'], 'url-a')]);
            const result = await routes.handleNotification(context, Buffer.from(MINIMUM));

            assert.strictEqual(result.statusCode, 200);
            // The documented success message, with the received UniqueID as our reservation ID.
            const expected = responseBody(fixture('response-success.xml').replace(/LH123456789/g, '123456789'));
            assert.deepStrictEqual(responseBody(result.body), expected);
            assert.match(result.body, /EchoToken="abc-123"/);
            assert.match(result.body, /TimeStamp="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z"/);
            // An empty SOAP header, as the integration requirements ask.
            assert.match(result.body, /<SOAP-ENV:Header\/>/);

            assert.strictEqual(context.delivered.length, 1);
            assert.deepStrictEqual(context.delivered[0].urls, ['url-a']);
            const payload = context.delivered[0].payload;
            assert.strictEqual(payload.reservationId, '123456789');
            assert.strictEqual(payload.hotelCode, '10107');
            assert.strictEqual(payload.status, 'Reserved');
            assert.strictEqual(payload.eventType, 'new');
            assert.strictEqual(payload.publisherCode, 'PMSPUBLISHER');
            assert.strictEqual(payload.totalAmountAfterTax, 200);
            assert.strictEqual(payload.arrivalDate, '2017-09-05');
        });

        it('accepts the quick start sample', async () => {

            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['123456789'])]);
            const result = await routes.handleNotification(context, QUICK_START);
            assert.strictEqual(result.statusCode, 200);
            assert.match(result.body, /<Success\/>/);
            assert.match(result.body, /EchoToken="cdcd51f2-769a-5a1d-841c-e6204d811f5c"/);
            assert.strictEqual(context.delivered[0].payload.hotelCode, '123456789');
        });

        it('answers the documented error 497 for a wrong password and delivers nothing', async () => {

            const context = createPluginContext([listener('USERNAME', 'another-password', ['10107'])]);
            const result = await routes.handleNotification(context, MINIMUM);

            assert.strictEqual(result.statusCode, 200);
            assert.deepStrictEqual(responseBody(result.body), responseBody(fixture('response-error-invalid-credentials.xml')));
            assert.match(result.body, /<Error Type="6" Code="497">Invalid Username and\/or Password<\/Error>/);
            assert.match(result.body, /EchoToken="abc-123"/);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('answers 497 for a wrong username, a missing security header, an empty password and a digest password', async () => {

            const listeners = [listener('USERNAME', 'PASSWORD', ['10107'])];
            const cases = [
                withCredentials(MINIMUM, 'SOMEONE', 'PASSWORD'),
                MINIMUM.replace(/<SOAP-ENV:Header>[\s\S]*<\/SOAP-ENV:Header>/, ''),
                MINIMUM.replace('>PASSWORD</wsse:Password>', '></wsse:Password>'),
                MINIMUM.replace('#PasswordText', '#PasswordDigest')
            ];
            for (const xml of cases) {
                const context = createPluginContext(listeners);
                const result = await routes.handleNotification(context, xml);
                assert.strictEqual(result.statusCode, 200);
                assert.match(result.body, /Code="497"/);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('answers 497 when no flow is running, even for a listener without a credential hash', async () => {

            for (const listeners of [[], [{ eventName: lib.RESERVATION_EVENT, url: 'u', params: { hotelCodes: ['10107'] } }]]) {
                const context = createPluginContext(listeners);
                const result = await routes.handleNotification(context, MINIMUM);
                assert.match(result.body, /Code="497"/);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('answers the documented error 392 for an unknown HotelCode and delivers nothing', async () => {

            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['SOME-OTHER-HOTEL'])]);
            const result = await routes.handleNotification(context, MINIMUM);

            assert.strictEqual(result.statusCode, 200);
            const expected = responseBody(fixture('response-error-hotel-not-found.xml').replace('XXXXXX', '10107'));
            assert.deepStrictEqual(responseBody(result.body), expected);
            assert.match(result.body, /<Error Type="6" Code="392">Hotel not found for HotelCode=10107<\/Error>/);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('never delivers one account\'s reservation to a flow of another account', async () => {

            const context = createPluginContext([
                // Same hotel code, other credentials: another partner application on the same instance.
                listener('OTHER-PARTNER', 'Other-P@ssw0rd-2026', ['10107'], 'url-other-partner'),
                // Same credentials, other hotel.
                listener('USERNAME', 'PASSWORD', ['20202'], 'url-other-hotel'),
                listener('USERNAME', 'PASSWORD', ['10107', '30303'], 'url-right'),
                // A second flow of the same account and hotel also gets it.
                listener('USERNAME', 'PASSWORD', ['10107'], 'url-right-2')
            ]);
            const result = await routes.handleNotification(context, MINIMUM);

            assert.match(result.body, /<Success\/>/);
            assert.deepStrictEqual(context.delivered[0].urls, ['url-right', 'url-right-2']);
        });

        it('answers 392, not success, when the hotel is known only to another account', async () => {

            const context = createPluginContext([
                listener('OTHER-PARTNER', 'Other-P@ssw0rd-2026', ['10107'], 'url-other-partner'),
                listener('USERNAME', 'PASSWORD', ['20202'], 'url-other-hotel')
            ]);
            const result = await routes.handleNotification(context, MINIMUM);
            assert.match(result.body, /Code="392"/);
            assert.strictEqual(context.delivered.length, 0);
        });

        it('does not tell an unauthenticated sender whether a hotel exists', async () => {

            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
            const known = await routes.handleNotification(context, withCredentials(MINIMUM, 'x', 'y'));
            const unknown = await routes.handleNotification(context,
                withCredentials(MINIMUM, 'x', 'y').replace('HotelCode="10107"', 'HotelCode="nope"'));
            assert.match(known.body, /Code="497"/);
            assert.match(unknown.body, /Code="497"/);
        });

        it('answers a SOAP fault with HTTP 500 for malformed XML and delivers nothing', async () => {

            const bodies = [
                MINIMUM.slice(0, 600),
                '<a><b></a>',
                'not xml at all',
                '',
                '<?xml version="1.0"?><Envelope><Body/></Envelope>',
                '<Envelope><Body><SomethingElse/></Body></Envelope>',
                '{"json": true}'
            ];
            for (const body of bodies) {
                const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
                const result = await routes.handleNotification(context, body);
                assert.strictEqual(result.statusCode, 500, body.slice(0, 30));
                assert.match(result.body, /<SOAP-ENV:Fault><faultcode>SOAP-ENV:Client<\/faultcode><faultstring xml:lang="en">[^<]+<\/faultstring><\/SOAP-ENV:Fault>/);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('refuses a DOCTYPE, entity declarations, an oversized body and deep nesting', async () => {

            const bomb = '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;">]>'
                + MINIMUM.replace('ID="123456789"', 'ID="&lol2;"');
            const external = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>' + MINIMUM;
            const big = MINIMUM.replace('<POS>', `<POS><!--${'x'.repeat(soap.MAX_XML_BYTES)}-->`);
            const deep = MINIMUM.replace('<POS>', `${'<a>'.repeat(200)}${'</a>'.repeat(200)}<POS>`);
            const veryDeep = '<a>'.repeat(50000) + '</a>'.repeat(50000);

            for (const body of [bomb, external, big, deep, veryDeep]) {
                const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
                const started = Date.now();
                const result = await routes.handleNotification(context, body);
                assert.strictEqual(result.statusCode, 500);
                assert.match(result.body, /SOAP-ENV:Client/);
                assert.strictEqual(context.delivered.length, 0);
                assert(Date.now() - started < 3000, 'a refused document must be refused quickly');
            }
        });

        it('does not let element or attribute names reach an object prototype', async () => {

            const xml = MINIMUM
                .replace('<POS>', '<__proto__ polluted="1"><polluted>1</polluted></__proto__><constructor><prototype><polluted>1</polluted></prototype></constructor><POS>')
                .replace('<UniqueID ID="123456789"/>', '<UniqueID ID="123456789" __proto__="x"/>');
            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
            const result = await routes.handleNotification(context, xml);
            assert.strictEqual(({}).polluted, undefined);
            // Either refused as a whole, or delivered without those names.
            if (result.statusCode === 200) {
                const tree = context.delivered[0].payload.reservation;
                assert.strictEqual(Object.getPrototypeOf(tree), Object.prototype);
                assert(!Object.keys(tree).includes('__proto__') && !Object.keys(tree).includes('constructor'));
            } else {
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('does not expand an undeclared entity and decodes the predefined ones once', () => {

            const xml = MINIMUM
                .replace('ID="123456789"', 'ID="A&amp;B &lt;x&gt; &#233;&#x1F600; &amp;lt; &unknown;"');
            const [reservation] = soap.parseNotification(xml).reservations;
            assert.strictEqual(reservation.reservationId, 'A&B <x> é\u{1F600} &lt; &unknown;');
        });

        it('escapes what it echoes into the answer', async () => {

            const xml = MINIMUM
                .replace('EchoToken="abc-123"', 'EchoToken="a&quot;&gt;&lt;Success/&gt;&lt;x y=&quot;"')
                .replace('ID="123456789"', 'ID="R&amp;D &lt;1&gt;"');
            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
            const result = await routes.handleNotification(context, xml);
            // The answer is still one well-formed document with the values intact.
            const response = soap.parseXml(result.body).Envelope.Body.OTA_HotelResNotifRS;
            assert.strictEqual(response['@_EchoToken'], 'a"><Success/><x y="');
            assert.strictEqual(response.HotelReservations.HotelReservation[0].UniqueID['@_ID'], 'R&D <1>');
            assert.strictEqual((result.body.match(/<Success\/>/g) || []).length, 1);
        });

        it('answers 321 when the reservation, its ID or its hotel code is missing', async () => {

            const cases = [
                [MINIMUM.replace(/<HotelReservations>[\s\S]*<\/HotelReservations>/, '<HotelReservations/>'), 'HotelReservation is missing'],
                [MINIMUM.replace('<UniqueID ID="123456789"/>', ''), 'UniqueID is missing'],
                [MINIMUM.replace('<BasicPropertyInfo HotelCode="10107"/>', ''), 'HotelCode is missing']
            ];
            for (const [xml, text] of cases) {
                const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
                const result = await routes.handleNotification(context, xml);
                assert.strictEqual(result.statusCode, 200);
                assert(result.body.includes(`<Error Type="10" Code="321">${text}</Error>`), result.body);
                assert.strictEqual(context.delivered.length, 0);
            }
        });

        it('processes a message with two reservations entirely or not at all', async () => {

            const second = '<HotelReservation ResStatus="Reserved" CreateDateTime="2018-05-04T19:32:04Z">'
                + '<UniqueID ID="R-2"/><ResGlobalInfo><BasicPropertyInfo HotelCode="20202"/></ResGlobalInfo></HotelReservation>';
            const xml = MINIMUM.replace('</HotelReservations>', second + '</HotelReservations>');

            const partial = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
            const refused = await routes.handleNotification(partial, xml);
            assert.match(refused.body, /Code="392">Hotel not found for HotelCode=20202/);
            assert.strictEqual(partial.delivered.length, 0);

            const full = createPluginContext([
                listener('USERNAME', 'PASSWORD', ['10107'], 'url-1'),
                listener('USERNAME', 'PASSWORD', ['20202'], 'url-2')
            ]);
            const accepted = await routes.handleNotification(full, xml);
            assert.match(accepted.body, /<Success\/>/);
            assert.match(accepted.body, /ResID_Value="123456789"[\s\S]*ResID_Value="R-2"/);
            assert.deepStrictEqual(full.delivered.map(item => item.urls), [['url-1'], ['url-2']]);
        });

        it('classifies the documented cancellation and modification samples', async () => {

            const context = createPluginContext([
                listener('USERNAME', 'PASSWORD', ['10107']),
                listener('USERNAME', 'PASSWORD', ['GRHP6597'])
            ]);
            await routes.handleNotification(context, CANCELLATION);
            await routes.handleNotification(context, MAXIMUM);
            assert.strictEqual(context.delivered[0].payload.eventType, 'cancelled');
            assert.strictEqual(context.delivered[0].payload.status, 'Cancelled');
            assert.deepStrictEqual(context.delivered[0].payload.roomStays, []);
            assert.strictEqual(context.delivered[1].payload.eventType, 'updated');
        });

        it('maps the maximum content sample and keeps payment card data out of the flow', () => {

            const notification = soap.parseNotification(MAXIMUM);
            const [reservation] = notification.reservations;

            assert.strictEqual(notification.username, 'USERNAME');
            assert.strictEqual(notification.passwordType, soap.PASSWORD_TEXT_TYPE);
            assert.strictEqual(reservation.reservationId, 'BDC-3685569477');
            assert.strictEqual(reservation.hotelCode, 'GRHP6597');
            assert.strictEqual(reservation.publisherCode, 'TESTPMS');
            assert.strictEqual(reservation.bookingChannelName, 'CompanyName0');
            assert.strictEqual(reservation.arrivalDate, '2017-12-01');
            assert.strictEqual(reservation.departureDate, '2017-12-03');
            assert.strictEqual(reservation.adults, 2);
            assert.strictEqual(reservation.guestCount, 2);
            assert.strictEqual(reservation.totalAmountBeforeTax, 217);
            assert.strictEqual(reservation.totalAmountAfterTax, 255.55);
            assert.strictEqual(reservation.currencyCode, 'AUD');
            assert.strictEqual(reservation.commissionAmount, 25);
            assert.strictEqual(reservation.primaryGuest.givenName, 'Ginny');
            assert.strictEqual(reservation.primaryGuest.email, 'Virginia.Woolf@hotmail.com');
            assert.strictEqual(reservation.primaryGuest.comments, undefined);
            assert.strictEqual(reservation.booker.surname, 'Woolf');
            assert.strictEqual(reservation.booker.givenName, 'Leo');
            assert.strictEqual(reservation.guests.length, 2);
            assert.strictEqual(reservation.guests[1].primary, false);
            assert.strictEqual(reservation.roomStays.length, 1);
            assert.strictEqual(reservation.roomStays[0].roomTypeCode, 'DLX');
            assert.strictEqual(reservation.roomStays[0].ratePlanCode, 'WKGPKG');
            assert.strictEqual(reservation.roomStays[0].dailyRates.length, 2);
            assert.strictEqual(reservation.roomStays[0].dailyRates[1].amountAfterTax, 88);
            assert.deepStrictEqual(reservation.roomStays[0].guestRphs, ['1', '2']);
            assert.strictEqual(reservation.services.length, 2);
            assert.strictEqual(reservation.services[0].inventoryCode, 'ACAR_PARK');
            assert.deepStrictEqual(reservation.hotelReservationIds, [{ type: '10', value: 'BDC3685170919', source: 'TESTPMS_GRHP6597' }]);
            assert.deepStrictEqual(reservation.comments, ['Business trip']);
            assert.strictEqual(reservation.reservation.ResStatus, 'Reserved');
            assert.strictEqual(reservation.reservation.ResGlobalInfo.BasicPropertyInfo.HotelCode, 'GRHP6597');

            // The sample carries card masks, tokens and holder names in four places.
            assert(/CardNumber/.test(MAXIMUM) && /4021XXXXXXXX8995/.test(MAXIMUM));
            const everything = JSON.stringify(reservation);
            for (const secret of ['PaymentCard', 'CardNumber', '4021', '0087254835699221', 'CardHolderName', 'Leonard Woolf', 'SeriesCode', '4555', 'USERNAME', 'PASSWORD']) {
                assert(!everything.includes(secret), `"${secret}" must not reach a flow`);
            }
        });

        it('reads the element variants of the reference (text in the element, PrimaryIndicator="1", two address lines)', () => {

            const xml = MINIMUM.replace('<RoomStays>', '<ResGuests><ResGuest ResGuestRPH="1" ArrivalTime="14:00:00" PrimaryIndicator="1"><Profiles><ProfileInfo><Profile ProfileType="1"><Customer>'
                + '<PersonName><GivenName>John</GivenName><Surname>O&apos;Brien &amp; Sons</Surname></PersonName><Telephone PhoneNumber="+61123456789"/><Email>test@siteminder.com</Email>'
                + '<Address><AddressLine>200 George St</AddressLine><AddressLine>Level 3</AddressLine><CityName>Sydney</CityName><StateProv>NSW</StateProv><CountryName>Australia</CountryName></Address>'
                + '</Customer></Profile></ProfileInfo></Profiles></ResGuest></ResGuests><RoomStays>')
                .replace('<RoomStay>', '<RoomStay><RoomTypes><RoomType RoomTypeCode="TPL"><RoomDescription Name="Triple Room">Double bed and single bed.</RoomDescription></RoomType></RoomTypes>'
                    + '<RatePlans><RatePlan RatePlanCode="BAR"><RatePlanDescription>Best Available Rate.</RatePlanDescription></RatePlan></RatePlans>'
                    + '<GuestCounts><GuestCount AgeQualifyingCode="10" Count="2"/><GuestCount AgeQualifyingCode="8" Age="7" Count="1"/><GuestCount AgeQualifyingCode="7" Count="1"/></GuestCounts>'
                    + '<SpecialRequests><SpecialRequest Name="Extra Bed"><Text>Yes</Text></SpecialRequest></SpecialRequests>');
            const [reservation] = soap.parseNotification(xml).reservations;
            assert.strictEqual(reservation.primaryGuest.primary, true);
            assert.strictEqual(reservation.primaryGuest.surname, 'O\'Brien & Sons');
            assert.strictEqual(reservation.primaryGuest.phoneNumber, '+61123456789');
            assert.strictEqual(reservation.primaryGuest.addressLine, '200 George St, Level 3');
            assert.strictEqual(reservation.primaryGuest.state, 'NSW');
            assert.strictEqual(reservation.roomStays[0].roomTypeName, 'Triple Room');
            assert.strictEqual(reservation.roomStays[0].roomDescription, 'Double bed and single bed.');
            assert.strictEqual(reservation.roomStays[0].ratePlanDescription, 'Best Available Rate.');
            assert.deepStrictEqual(reservation.roomStays[0].specialRequests, [{ name: 'Extra Bed', text: 'Yes' }]);
            // No counts on the reservation level: the rooms are added up.
            assert.strictEqual(reservation.adults, 2);
            assert.strictEqual(reservation.children, 1);
            assert.strictEqual(reservation.infants, 1);
            assert.strictEqual(reservation.guestCount, 4);
        });

        it('accepts every documented ResStatus', async () => {

            for (const status of ['Reserved', 'Waitlisted', 'Cancelled', 'No-show', 'In-house', 'Checked-Out', 'Redacted']) {
                const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
                const result = await routes.handleNotification(context, MINIMUM.replace('ResStatus="Reserved"', `ResStatus="${status}"`));
                assert.match(result.body, /<Success\/>/);
                assert.strictEqual(context.delivered[0].payload.status, status);
            }
        });

        it('registers one POST route that reads the raw body and answers XML; a failed hand-over is a 500 fault', async () => {

            const context = createPluginContext([listener('USERNAME', 'PASSWORD', ['10107'])]);
            routes(context);
            assert.strictEqual(context.registered.length, 1);
            const [route] = context.registered;
            assert.strictEqual(route.method, 'POST');
            assert.strictEqual(route.path, '/reservations');
            assert.strictEqual(route.options.auth, false);
            assert.strictEqual(route.options.payload.parse, false);
            assert.strictEqual(route.options.payload.maxBytes, soap.MAX_XML_BYTES);

            const reply = () => {
                const answer = {};
                const chain = {
                    type(value) { answer.type = value; return chain; },
                    code(value) { answer.code = value; return chain; }
                };
                return { answer, h: { response(body) { answer.body = body; return chain; } } };
            };

            const ok = reply();
            await route.options.handler({ payload: Buffer.from(MINIMUM) }, ok.h);
            assert.strictEqual(ok.answer.code, 200);
            assert.strictEqual(ok.answer.type, 'application/xml; charset=utf-8');
            assert.match(ok.answer.body, /<Success\/>/);

            // The store is down: SiteMinder must retry, so no success and no OTA error.
            context.failDelivery = new Error('mongo is down');
            const failed = reply();
            await route.options.handler({ payload: Buffer.from(MINIMUM) }, failed.h);
            assert.strictEqual(failed.answer.code, 500);
            assert.match(failed.answer.body, /SOAP-ENV:Server/);
            assert(!/mongo/.test(failed.answer.body));
            // Neither the message nor the credentials are logged.
            assert(!JSON.stringify(context.logs).includes('PASSWORD'));
            assert(!JSON.stringify(context.logs).includes('123456789'));
        });

        it('refuses a listener without a credential hash or hotel codes', async () => {

            const context = createPluginContext();
            routes(context);
            const [check] = context.listenerCallbacks;
            await check(listener('u', 'p', ['H1']));
            await assert.rejects(() => check({ params: { hotelCodes: ['H1'] } }), /hash/);
            await assert.rejects(() => check({ params: { credentialHash: 'short', hotelCodes: ['H1'] } }), /hash/);
            await assert.rejects(() => check({ params: { credentialHash: lib.credentialHash('u', 'p'), hotelCodes: [] } }), /hotel code/);
            await assert.rejects(() => check({ params: { credentialHash: lib.credentialHash('u', 'p') } }), /hotel code/);
            await assert.rejects(() => check({}), /hash/);
        });
    });

    describe('reservation triggers', () => {

        // A reservation as the endpoint hands it over for the test account: with its delivery proof.
        const unsigned = (extra = {}) => ({
            reservationId: 'R-1', status: 'Reserved', hotelCode: 'H1', eventType: 'new', ...extra
        });
        const reservation = (extra = {}) => {
            const data = unsigned(extra);
            return { ...data, deliveryProof: lib.deliveryProof(ACCOUNT.soapUsername, STRONG_PASSWORD, data) };
        };

        it('start() registers the hash of the endpoint credentials and the hotel codes, never the password', async () => {

            const context = createContext({ properties: { hotelCodes: 'H1, H2\nH3,H1' } });
            await NewReservation.start(context);
            assert.strictEqual(context.listeners.length, 1);
            assert.strictEqual(context.listeners[0].eventName, 'reservation');
            assert.deepStrictEqual(context.listeners[0].params, {
                credentialHash: lib.credentialHash(ACCOUNT.soapUsername, STRONG_PASSWORD),
                hotelCodes: ['H1', 'H2', 'H3']
            });
            assert(!JSON.stringify(context.listeners).includes(STRONG_PASSWORD));

            await NewReservation.stop(context);
            assert.deepStrictEqual(context.removed, ['reservation']);
        });

        it('what a trigger registers is what the endpoint matches', async () => {

            const context = createContext({ properties: { hotelCodes: '10107' } });
            await NewReservationMessage.start(context);
            const plugin = createPluginContext([{ ...context.listeners[0], url: 'url-a' }]);
            const result = await routes.handleNotification(plugin, withCredentials(MINIMUM, ACCOUNT.soapUsername, STRONG_PASSWORD));
            assert.match(result.body, /<Success\/>/);
            assert.deepStrictEqual(plugin.delivered[0].urls, ['url-a']);
        });

        it('start() fails without endpoint credentials, with weak ones, and without hotel codes', async () => {

            const noCredentials = createContext({ auth: { environment: 'production', apiToken: 't' }, properties: { hotelCodes: 'H1' } });
            await assert.rejects(() => NewReservation.start(noCredentials), /no endpoint credentials/);
            const weak = createContext({ auth: { ...ACCOUNT, soapPassword: 'short' }, properties: { hotelCodes: 'H1' } });
            await assert.rejects(() => UpdatedReservation.start(weak), /at least 12 characters/);
            const noHotel = createContext({ properties: { hotelCodes: ' , ' } });
            await assert.rejects(() => CancelledReservation.start(noHotel), /Hotel Codes is required/);
            for (const context of [noCredentials, weak, noHotel]) {
                assert.strictEqual(context.listeners.length, 0);
            }
        });

        it('each trigger passes on its own kind of reservation', async () => {

            const kinds = [
                [NewReservation, 'new'],
                [UpdatedReservation, 'updated'],
                [CancelledReservation, 'cancelled']
            ];
            for (const [component, wanted] of kinds) {
                for (const eventType of ['new', 'updated', 'cancelled']) {
                    const context = createContext({ properties: { hotelCodes: 'H1' }, webhook: reservation({ eventType }) });
                    await component.receive(context);
                    assert.strictEqual(context.sent.length, eventType === wanted ? 1 : 0, `${wanted} / ${eventType}`);
                    if (context.sent.length) {
                        assert.strictEqual(context.sent[0].port, 'out');
                        assert.strictEqual(context.sent[0].data.reservationId, 'R-1');
                    }
                }
            }
        });

        it('New Reservation Message passes on everything, or the chosen statuses', async () => {

            const all = createContext({ properties: { hotelCodes: 'H1' }, webhook: reservation({ status: 'In-house', eventType: 'updated' }) });
            await NewReservationMessage.receive(all);
            assert.strictEqual(all.sent.length, 1);

            for (const statuses of [['In-house', 'Checked-Out'], 'In-house,Checked-Out']) {
                const match = createContext({ properties: { hotelCodes: 'H1', statuses }, webhook: reservation({ status: 'In-house' }) });
                await NewReservationMessage.receive(match);
                assert.strictEqual(match.sent.length, 1);
                const other = createContext({ properties: { hotelCodes: 'H1', statuses }, webhook: reservation({ status: 'Reserved' }) });
                await NewReservationMessage.receive(other);
                assert.strictEqual(other.sent.length, 0);
            }
        });

        it('a trigger ignores a reservation of a hotel it does not list, and a call that is not a webhook', async () => {

            const otherHotel = createContext({ properties: { hotelCodes: 'H1' }, webhook: reservation({ hotelCode: 'H9' }) });
            await NewReservation.receive(otherHotel);
            assert.strictEqual(otherHotel.sent.length, 0);

            const noWebhook = createContext({ properties: { hotelCodes: 'H1' } });
            await NewReservation.receive(noWebhook);
            assert.strictEqual(noWebhook.sent.length, 0);

            const empty = createContext({ properties: { hotelCodes: 'H1' }, webhook: {} });
            await NewReservationMessage.receive(empty);
            assert.strictEqual(empty.sent.length, 0);
        });

        it('a trigger drops a reservation that did not come through the endpoint with its account\'s credentials', async () => {

            // Posted straight to the trigger's own webhook URL: no proof, a made-up proof, or the
            // proof of another account.
            const forged = [
                unsigned(),
                { ...unsigned(), deliveryProof: 'a'.repeat(64) },
                { ...unsigned(), deliveryProof: lib.deliveryProof('someone', 'Else-P@ssw0rd-2026', unsigned()) },
                // A genuine proof reused for another reservation.
                { ...reservation(), reservationId: 'R-2' },
                { ...reservation(), hotelCode: 'H2' }
            ];
            for (const data of forged) {
                for (const component of [NewReservationMessage, NewReservation]) {
                    const context = createContext({ properties: { hotelCodes: 'H1, H2' }, webhook: data });
                    await component.receive(context);
                    assert.strictEqual(context.sent.length, 0);
                }
            }

            // An account without endpoint credentials accepts nothing.
            const noCredentials = createContext({ auth: { environment: 'production', apiToken: 't' }, properties: { hotelCodes: 'H1' }, webhook: reservation() });
            await NewReservationMessage.receive(noCredentials);
            assert.strictEqual(noCredentials.sent.length, 0);

            // The genuine one arrives, without the proof.
            const genuine = createContext({ properties: { hotelCodes: 'H1' }, webhook: reservation() });
            await NewReservation.receive(genuine);
            assert.deepStrictEqual(genuine.sent, [{ data: unsigned(), port: 'out' }]);
        });

        it('what the endpoint hands over passes the trigger of the same account only', async () => {

            const started = createContext({ properties: { hotelCodes: '10107' } });
            await NewReservation.start(started);
            const plugin = createPluginContext([{ ...started.listeners[0], url: 'url-a' }]);
            await routes.handleNotification(plugin, withCredentials(MINIMUM, ACCOUNT.soapUsername, STRONG_PASSWORD));
            const delivered = plugin.delivered[0].payload;
            assert.match(delivered.deliveryProof, /^[0-9a-f]{64}$/);

            const same = createContext({ properties: { hotelCodes: '10107' }, webhook: delivered });
            await NewReservation.receive(same);
            assert.strictEqual(same.sent.length, 1);
            assert.strictEqual(same.sent[0].data.reservationId, '123456789');
            assert.strictEqual(same.sent[0].data.deliveryProof, undefined);

            const other = createContext({ auth: { ...ACCOUNT, soapPassword: 'Other-P@ssw0rd-2026' }, properties: { hotelCodes: '10107' }, webhook: delivered });
            await NewReservation.receive(other);
            assert.strictEqual(other.sent.length, 0);
        });

        it('test() throws instead of making up a reservation', async () => {

            for (const component of [NewReservationMessage, NewReservation, UpdatedReservation, CancelledReservation]) {
                const context = createContext({ properties: { hotelCodes: 'H1' } });
                await assert.rejects(() => component.test(context), err => err instanceof CancelError && /no API to read one/.test(err.message));
                assert.strictEqual(context.sent.length, 0);
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('classifyReservation follows the documented samples', () => {

            assert.strictEqual(lib.classifyReservation({ status: 'Reserved', createdAt: '2018-05-04T19:32:04Z' }), 'new');
            assert.strictEqual(lib.classifyReservation({ status: 'Reserved', createdAt: '2025-07-06T15:27:41+00:00', lastModifiedAt: '2025-07-06T15:27:41+00:00' }), 'new');
            assert.strictEqual(lib.classifyReservation({ status: 'Waitlisted', createdAt: '2025-07-06T15:27:41Z', lastModifiedAt: '2025-07-06T17:27:41+02:00' }), 'new');
            assert.strictEqual(lib.classifyReservation({ status: 'Reserved', createdAt: '2024-07-06T18:02:44+00:00', lastModifiedAt: '2024-07-06T18:13:51+00:00' }), 'updated');
            assert.strictEqual(lib.classifyReservation({ status: 'In-house', createdAt: '2024-07-06T18:02:44Z', lastModifiedAt: '2024-07-08T14:00:00Z' }), 'updated');
            assert.strictEqual(lib.classifyReservation({ status: 'Cancelled', createdAt: '2018-05-04T19:32:04Z' }), 'cancelled');
            assert.strictEqual(lib.classifyReservation({ status: 'Cancelled', createdAt: '2018-05-04T19:32:04Z', lastModifiedAt: '2018-09-20T07:55:04Z' }), 'cancelled');
        });
    });

    describe('account', () => {

        it('validates the token with GET /publishers of the chosen environment', async () => {

            const production = createAuthContext({ environment: 'production', apiToken: ' Bearer abc.def.ghi\n' });
            assert.strictEqual(await auth.definition.validate(production), true);
            assert.strictEqual(production.requests.length, 1);
            assert.strictEqual(production.requests[0].url, `${PRODUCTION}/inventory/v1/publishers`);
            assert.strictEqual(production.requests[0].headers.Authorization, 'Bearer abc.def.ghi');

            const preproduction = createAuthContext({ environment: 'preproduction', apiToken: 'abc' });
            await auth.definition.validate(preproduction);
            assert.strictEqual(preproduction.requests[0].url, `${PREPRODUCTION}/inventory/v1/publishers`);

            // No environment chosen: production.
            const fallback = createAuthContext({ apiToken: 'abc' });
            await auth.definition.validate(fallback);
            assert.strictEqual(fallback.requests[0].url, `${PRODUCTION}/inventory/v1/publishers`);
        });

        it('makes no request for an unknown environment', async () => {

            for (const environment of ['evil.example/x?', 'https://evil.example', 'staging']) {
                const context = createAuthContext({ environment, apiToken: 'abc' });
                await assert.rejects(() => auth.definition.validate(context), /Unknown SiteMinder environment/);
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('accepts endpoint credentials alone, without any request', async () => {

            const context = createAuthContext({ environment: 'preproduction', soapUsername: 'appmixer-smx', soapPassword: STRONG_PASSWORD });
            assert.strictEqual(await auth.definition.validate(context), true);
            assert.strictEqual(context.requests.length, 0);
            assert.deepStrictEqual(auth.definition.requestProfileInfo(context), { name: 'appmixer-smx (pre-production)' });
        });

        it('refuses an empty form, half of the endpoint credentials, forbidden characters and a weak password', async () => {

            const cases = [
                [{}, /Fill in the API Token/],
                [{ soapUsername: 'user' }, /filled in together/],
                [{ soapPassword: STRONG_PASSWORD }, /filled in together/],
                [{ soapUsername: 'us<er', soapPassword: STRONG_PASSWORD }, /must not contain/],
                [{ soapUsername: 'user', soapPassword: 'MyP&ssw0rd2024!Secure' }, /must not contain/],
                [{ soapUsername: 'user', soapPassword: 'Sh0rt!' }, /at least 12 characters/],
                [{ soapUsername: 'user', soapPassword: 'alllowercase-password-1' }, /at least 12 characters/],
                [{ soapUsername: ' user', soapPassword: STRONG_PASSWORD }, /start or end with a space/]
            ];
            for (const [fields, expected] of cases) {
                const context = createAuthContext({ environment: 'production', ...fields });
                await assert.rejects(() => auth.definition.validate(context), err => err instanceof InvalidTokenError && expected.test(err.message));
                assert.strictEqual(context.requests.length, 0);
            }
        });

        it('marks the account invalid only for a 401', async () => {

            const unauthorized = createAuthContext({ apiToken: 'abc' }, [httpError(401, { name: 'UnauthorizedError', message: 'jwt malformed' })]);
            await assert.rejects(() => auth.definition.validate(unauthorized), err => err instanceof InvalidTokenError && /jwt malformed/.test(err.message));

            const limited = createAuthContext({ apiToken: 'abc' }, [httpError(429, { message: 'Too many requests' })]);
            await assert.rejects(() => auth.definition.validate(limited), err => !(err instanceof InvalidTokenError) && /rate limit/.test(err.message));
        });

        it('names the account after the subscriber code in the token', () => {

            const payload = Buffer.from(JSON.stringify({ iat: 1576812219, aud: 'subscriberx/api', sub: 'subscriberCode' })).toString('base64url');
            const context = createAuthContext({ environment: 'production', apiToken: `e30.${payload}.sig`, soapUsername: 'user' });
            assert.deepStrictEqual(auth.definition.requestProfileInfo(context), { name: 'subscriberCode' });
            assert.deepStrictEqual(auth.definition.requestProfileInfo(createAuthContext({ apiToken: 'not-a-jwt', soapUsername: 'user' })), { name: 'user' });
            assert.deepStrictEqual(auth.definition.requestProfileInfo(createAuthContext({ apiToken: 'not-a-jwt' })), { name: 'SiteMinder Exchange' });
        });
    });

    describe('availability and rates components', () => {

        const PUBLISHERS = [
            { name: 'Harbour PMS', code: 'HARBOUR', messageTypes: ['Reservations', 'ARI'] },
            { name: 'Little Hotelier', code: 'littlehotelier', messageTypes: ['Reservations'] }
        ];
        const HOTELS = [
            { name: 'Golden River Hotel', code: 'GRHP6597', currency: 'AUD', timezone: 'Australia/Sydney', messageTypes: ['ARI'] },
            { name: 'Silver Lake Inn', code: 'SLI/1', currency: 'EUR', timezone: 'Europe/Prague', messageTypes: ['ARI'] }
        ];

        it('Find Publishers reads /publishers with the Bearer token', async () => {

            const context = createContext({ responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(context);
            assert.deepStrictEqual(context.requests, [{
                method: 'GET',
                url: `${PRODUCTION}/inventory/v1/publishers`,
                headers: { Accept: 'application/json', Authorization: 'Bearer token-1' }
            }]);
            assert.deepStrictEqual(context.sent, [{ data: { result: PUBLISHERS, count: 2 }, port: 'out' }]);
        });

        it('Find Publishers filters by name or code and uses notFound', async () => {

            const byCode = createContext({ content: { name: 'LITTLE', outputType: 'first' }, responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(byCode);
            assert.deepStrictEqual(byCode.sent, [{ data: { ...PUBLISHERS[1], index: 0, count: 1 }, port: 'out' }]);

            const none = createContext({ content: { name: 'zzz' }, responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(none);
            assert.deepStrictEqual(none.sent, [{ data: {}, port: 'notFound' }]);

            const empty = createContext({ responses: [{ data: [] }] });
            await FindPublishers.receive(empty);
            assert.deepStrictEqual(empty.sent, [{ data: {}, port: 'notFound' }]);
        });

        it('an account without a token makes no request', async () => {

            const context = createContext({ auth: { environment: 'production', soapUsername: 'u', soapPassword: STRONG_PASSWORD } });
            await assert.rejects(() => FindPublishers.receive(context), err => err instanceof CancelError && /no API token/.test(err.message));
            assert.strictEqual(context.requests.length, 0);
        });

        it('a pre-production account calls the pre-production host; an unknown environment calls nothing', async () => {

            const preproduction = createContext({ auth: { ...ACCOUNT, environment: 'preproduction' }, responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(preproduction);
            assert.strictEqual(preproduction.requests[0].url, `${PREPRODUCTION}/inventory/v1/publishers`);

            const unknown = createContext({ auth: { ...ACCOUNT, environment: 'evil.example' } });
            await assert.rejects(() => FindPublishers.receive(unknown), /Unknown SiteMinder environment/);
            assert.strictEqual(unknown.requests.length, 0);
        });

        it('Find Hotels encodes the publisher code as one path segment', async () => {

            const context = createContext({ content: { publisherCode: ' a/b?c#d ' }, responses: [{ data: HOTELS }] });
            await FindHotels.receive(context);
            assert.strictEqual(context.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/a%2Fb%3Fc%23d/hotels`);
            assert.strictEqual(context.sent[0].data.count, 2);

            for (const publisherCode of ['..', '.', 'x'.repeat(256)]) {
                const refused = createContext({ content: { publisherCode } });
                await assert.rejects(() => FindHotels.receive(refused), err => err instanceof CancelError && /not a valid code/.test(err.message));
                assert.strictEqual(refused.requests.length, 0);
            }

            const missing = createContext({ content: {} });
            await assert.rejects(() => FindHotels.receive(missing), /Publisher is required/);
        });

        it('the dropdown sources are cached, tolerate missing dependencies and swallow errors', async () => {

            const first = createContext({ properties: { isSource: true }, responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(first);
            await FindPublishers.receive(first);
            assert.strictEqual(first.requests.length, 1);
            assert.strictEqual(first.cacheTtl, 2 * 60 * 1000);
            assert.deepStrictEqual(FindPublishers.toSelectArray(first.sent[1].data), [
                { label: 'Harbour PMS (HARBOUR)', value: 'HARBOUR' },
                { label: 'Little Hotelier (littlehotelier)', value: 'littlehotelier' }
            ]);

            const noPublisher = createContext({ properties: { isSource: true } });
            await FindHotels.receive(noPublisher);
            assert.deepStrictEqual(noPublisher.sent, [{ data: { result: [] }, port: 'out' }]);
            assert.strictEqual(noPublisher.requests.length, 0);

            const noHotel = createContext({ properties: { isSource: true }, content: { publisherCode: 'HARBOUR' } });
            await FindRoomTypes.receive(noHotel);
            await FindRatePlans.receive(noHotel);
            assert.strictEqual(noHotel.requests.length, 0);

            const failing = createContext({ properties: { isSource: true }, content: { publisherCode: 'HARBOUR' }, responses: [httpError(403, { message: 'Forbidden' })] });
            await FindHotels.receive(failing);
            assert.deepStrictEqual(failing.sent, [{ data: { result: [] }, port: 'out' }]);
            assert.deepStrictEqual(FindHotels.toSelectArray({ result: HOTELS })[1], { label: 'Silver Lake Inn (SLI/1)', value: 'SLI/1' });
        });

        it('two accounts never share a cached dropdown', async () => {

            const a = createContext({ properties: { isSource: true }, responses: [{ data: PUBLISHERS }] });
            await FindPublishers.receive(a);
            const b = createContext({ auth: { ...ACCOUNT, apiToken: 'token-2' }, properties: { isSource: true }, responses: [{ data: [] }] });
            b.cache = a.cache;
            await FindPublishers.receive(b);
            assert.strictEqual(b.requests.length, 1);
            assert.deepStrictEqual(b.sent[0].data, { result: [] });
        });

        it('Find Room Types and Find Rate Plans add a plain name next to the language lists', async () => {

            const roomTypes = [{ code: 'DLX', names: [{ lang: 'de', name: 'Deluxe Zimmer' }, { lang: 'en', name: 'Deluxe Room' }], descriptions: [{ lang: 'de', description: 'Mit Hafenblick' }] }, { code: 'STD' }];
            const context = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'SLI/1', outputType: 'object' }, responses: [{ data: roomTypes }] });
            await FindRoomTypes.receive(context);
            assert.strictEqual(context.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/SLI%2F1/roomTypes`);
            assert.strictEqual(context.sent.length, 2);
            assert.strictEqual(context.sent[0].data.name, 'Deluxe Room');
            assert.strictEqual(context.sent[0].data.description, 'Mit Hafenblick');
            assert.deepStrictEqual(context.sent[1].data, { code: 'STD', index: 1, count: 2 });

            const ratePlans = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597' }, responses: [{ data: [{ code: 'BAR', names: [{ lang: 'en', name: 'Best Available Rate' }] }] }] });
            await FindRatePlans.receive(ratePlans);
            assert.strictEqual(ratePlans.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/ratePlans`);
            assert.strictEqual(ratePlans.sent[0].data.result[0].name, 'Best Available Rate');

            const missingHotel = createContext({ content: { publisherCode: 'HARBOUR' } });
            await assert.rejects(() => FindRatePlans.receive(missingHotel), /Hotel is required/);
        });

        it('Get Room Type and Get Rate Plan read one resource and refuse an answer that is not an object', async () => {

            const roomType = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', roomTypeCode: 'D LX' }, responses: [{ data: { code: 'D LX', names: [{ lang: 'en', name: 'Deluxe' }] } }] });
            await GetRoomType.receive(roomType);
            assert.strictEqual(roomType.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/roomTypes/D%20LX`);
            assert.deepStrictEqual(roomType.sent, [{ data: { code: 'D LX', names: [{ lang: 'en', name: 'Deluxe' }], name: 'Deluxe' }, port: 'out' }]);

            const ratePlan = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR' }, responses: [{ data: { code: 'BAR', minLOS: 1 } }] });
            await GetRatePlan.receive(ratePlan);
            assert.strictEqual(ratePlan.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/ratePlans/BAR`);
            assert.deepStrictEqual(ratePlan.sent[0].data, { code: 'BAR', minLOS: 1 });

            const odd = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR' }, responses: [{ data: '' }] });
            await assert.rejects(() => GetRatePlan.receive(odd), /unexpected answer/);
            assert.strictEqual(odd.sent.length, 0);

            const missing = createContext({ content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597' } });
            await assert.rejects(() => GetRoomType.receive(missing), /Room Type is required/);
        });

        it('the dated components send startDate and range as the API expects them', async () => {

            const availability = [{ date: '2026-12-01', bookingLimit: 4, roomTypeCode: 'DLX' }];
            const byRoomType = createContext({
                content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', roomTypeCode: 'DLX', startDate: '2026-12-01T00:00:00+13:00', range: '30' },
                responses: [{ data: availability }]
            });
            await FindRoomTypeAvailability.receive(byRoomType);
            assert.strictEqual(byRoomType.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/roomTypes/DLX/availability`);
            // The day as it was written, whatever the time zone of the value.
            assert.deepStrictEqual(byRoomType.requests[0].params, { startDate: '2026-12-01', range: 30 });
            assert.deepStrictEqual(byRoomType.sent[0].data, { result: availability, count: 1 });

            const byRatePlan = createContext({
                content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR', startDate: '2026-12-01' },
                responses: [{ data: [] }]
            });
            await FindRatePlanAvailability.receive(byRatePlan);
            assert.strictEqual(byRatePlan.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/ratePlans/BAR/availability`);
            assert.deepStrictEqual(byRatePlan.requests[0].params, { startDate: '2026-12-01', range: 1 });
            assert.deepStrictEqual(byRatePlan.sent, [{ data: {}, port: 'notFound' }]);

            const rates = createContext({
                content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'NO_RATE_PLAN_PROVIDED_SM', startDate: '2026-12-01', range: 7, outputType: 'file' },
                responses: [{ data: [{ date: '2026-12-01', currencyCode: 'AUD', baseGuestAmount: [{ ageQualifier: 'Adult', guestCount: 2, amountAfterTax: 198 }] }] }]
            });
            await FindRates.receive(rates);
            assert.strictEqual(rates.requests[0].url, `${PRODUCTION}/inventory/v1/publishers/HARBOUR/hotels/GRHP6597/ratePlans/NO_RATE_PLAN_PROVIDED_SM/rates`);
            assert.deepStrictEqual(rates.sent, [{ data: { fileId: 'file-1' }, port: 'out' }]);
            assert.match(rates.files[0].content, /^date,currencyCode,baseGuestAmount\n2026-12-01,AUD,"\[\{""ageQualifier""/);
        });

        it('without a Start Date the dated components read from today (UTC)', async () => {

            const context = createContext({
                content: { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR' },
                responses: [{ data: [{ date: '2026-12-01' }] }]
            });
            const before = new Date().toISOString().slice(0, 10);
            await FindRates.receive(context);
            const after = new Date().toISOString().slice(0, 10);
            assert([before, after].includes(context.requests[0].params.startDate));
            assert.strictEqual(context.requests[0].params.range, 1);
            assert.strictEqual(lib.toDateOnly(context, '', 'Start Date', new Date('2026-12-31T23:59:59Z')), '2026-12-31');
        });

        it('the dated components refuse a bad date or range before any request', async () => {

            const base = { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR', roomTypeCode: 'DLX' };
            const cases = [
                [{ ...base, startDate: 'tomorrow' }, /not a valid date/],
                [{ ...base, startDate: '2026-02-30' }, /not a valid date/],
                [{ ...base, startDate: '2026-12-01', range: 31 }, /between 1 and 30/],
                [{ ...base, startDate: '2026-12-01', range: 0 }, /between 1 and 30/],
                [{ ...base, startDate: '2026-12-01', range: '1.5' }, /between 1 and 30/]
            ];
            for (const [content, expected] of cases) {
                for (const component of [FindRates, FindRoomTypeAvailability, FindRatePlanAvailability]) {
                    const context = createContext({ content });
                    await assert.rejects(() => component.receive(context), err => err instanceof CancelError && expected.test(err.message));
                    assert.strictEqual(context.requests.length, 0);
                }
            }
        });

        it('API errors carry SiteMinder\'s message; only a retry-worthy one is retried', async () => {

            const content = { publisherCode: 'HARBOUR', hotelCode: 'GRHP6597', ratePlanCode: 'BAR', startDate: '2026-12-01' };

            const notSupported = createContext({ content, responses: [httpError(405, { name: 'MethodNotAllowedError', message: 'ARI Delivery not supported by this publisher' }, { 'x-sm-reference-id': 'ref-1' })] });
            await assert.rejects(() => FindRates.receive(notSupported), err => err instanceof CancelError
                && /does not provide availability and rates/.test(err.message) && /ARI Delivery not supported/.test(err.message) && /reference ref-1/.test(err.message));

            const validation = createContext({ content, responses: [httpError(400, { errors: [{ keyword: 'format', message: 'should match format \'date\'' }] })] });
            await assert.rejects(() => FindRates.receive(validation), err => err instanceof CancelError && /should match format/.test(err.message));

            const limited = createContext({ content, responses: [httpError(429, { message: 'Too many requests' }, { 'retry-after': '30' })] });
            await assert.rejects(() => FindRates.receive(limited), err => !(err instanceof CancelError) && /rate limit/.test(err.message));

            const outage = createContext({ content, responses: [httpError(500, { code: 'InternalServerError', message: 'boom' })] });
            await assert.rejects(() => FindRates.receive(outage), err => !(err instanceof CancelError) && /HTTP 500: boom/.test(err.message));

            const unexpected = createContext({ content, responses: [{ data: { not: 'an array' } }] });
            await assert.rejects(() => FindRates.receive(unexpected), /unexpected answer/);
        });

        it('the Find components describe their dynamic output from the exported item schema', async () => {

            for (const component of [FindPublishers, FindHotels, FindRoomTypes, FindRatePlans, FindRoomTypeAvailability, FindRatePlanAvailability, FindRates]) {
                assert.strictEqual(component.ITEM_SCHEMA.type, 'object');
                const context = createContext({ content: { outputType: 'object' }, properties: { generateOutputPortOptions: true } });
                await component.receive(context);
                const options = context.sent[0].data;
                assert.deepStrictEqual(options.slice(0, 2).map(option => option.value), ['index', 'count']);
                assert.deepStrictEqual(options.slice(2).map(option => option.value), Object.keys(component.ITEM_SCHEMA.properties));
                assert.strictEqual(context.requests.length, 0);
            }
        });
    });

    describe('Make API Call', () => {

        it('calls a path on the API host of the account with its token', async () => {

            const context = createContext({
                content: {
                    url: '/inventory/v1/publishers',
                    method: 'GET',
                    headers: JSON.stringify({ 'X-Test': '1', authorization: 'Bearer stolen' }),
                    parameters: JSON.stringify({ startDate: '2026-12-01' })
                },
                responses: [{ status: 200, headers: { 'x-sm-reference-id': 'r' }, data: [] }]
            });
            await MakeApiCall.receive(context);
            assert.deepStrictEqual(context.requests, [{
                method: 'GET',
                url: `${PRODUCTION}/inventory/v1/publishers`,
                headers: { 'X-Test': '1', Authorization: 'Bearer token-1' },
                params: { startDate: '2026-12-01' }
            }]);
            assert.deepStrictEqual(context.sent, [{ data: { statusCode: 200, headers: { 'x-sm-reference-id': 'r' }, body: [] }, port: 'out' }]);
        });

        it('accepts a full URL only on the host of the account\'s environment', async () => {

            const ok = createContext({ auth: { ...ACCOUNT, environment: 'preproduction' }, content: { url: `${PREPRODUCTION}/inventory/v1/publishers`, method: 'GET' } });
            await MakeApiCall.receive(ok);
            assert.strictEqual(ok.requests[0].url, `${PREPRODUCTION}/inventory/v1/publishers`);

            const foreign = [
                'https://evil.example/inventory/v1/publishers',
                '//evil.example/x',
                '\\\\evil.example\\x',
                'https://exchange-api.siteminder.com.evil.example/x',
                'https://exchange-api.siteminder.com@evil.example/x',
                'https://user:pass@exchange-api.siteminder.com/x',
                'http://exchange-api.siteminder.com/x',
                'https://exchange-api.siteminder.com:8443/x',
                // The other environment's host is foreign to this account, too.
                `${PREPRODUCTION}/inventory/v1/publishers`
            ];
            for (const url of foreign) {
                const context = createContext({ content: { url, method: 'GET' } });
                await assert.rejects(() => MakeApiCall.receive(context), err => err instanceof CancelError, url);
                assert.strictEqual(context.requests.length, 0, url);
            }
        });

        it('sends a JSON body and refuses invalid JSON, a missing path and a missing method', async () => {

            const withBody = createContext({ content: { url: 'inventory/v1/x', method: 'PUT', body: '{"a":1}' } });
            await MakeApiCall.receive(withBody);
            assert.strictEqual(withBody.requests[0].url, `${PRODUCTION}/inventory/v1/x`);
            assert.deepStrictEqual(withBody.requests[0].data, { a: 1 });

            await assert.rejects(() => MakeApiCall.receive(createContext({ content: { url: '/x', method: 'PUT', body: '{a' } })), /must be valid JSON/);
            await assert.rejects(() => MakeApiCall.receive(createContext({ content: { method: 'GET' } })), /API Endpoint Path is required/);
            await assert.rejects(() => MakeApiCall.receive(createContext({ content: { url: '/x' } })), /HTTP Method is required/);
        });
    });

    describe('helpers', () => {

        it('credentialHash separates the two values and safeEqual compares whole strings', () => {

            assert.notStrictEqual(lib.credentialHash('ab', 'c'), lib.credentialHash('a', 'bc'));
            assert.strictEqual(lib.credentialHash('a', 'b'), lib.credentialHash('a', 'b'));
            assert.match(lib.credentialHash('a', 'b'), /^[0-9a-f]{64}$/);
            assert.strictEqual(lib.safeEqual('abc', 'abc'), true);
            assert.strictEqual(lib.safeEqual('abc', 'abd'), false);
            assert.strictEqual(lib.safeEqual('abc', 'abcd'), false);
            assert.strictEqual(lib.safeEqual(undefined, 'abc'), false);
            assert.strictEqual(lib.safeEqual('abc', null), false);
        });

        it('toCsv quotes cells and keeps columns aligned', () => {

            assert.strictEqual(lib.toCsv([]), '');
            assert.strictEqual(lib.toCsv([{ a: 'x,y', b: 'say "hi"' }, { b: 1, c: null }]), 'a,b,c\n"x,y","say ""hi""",\n,1,');
        });
    });
});
