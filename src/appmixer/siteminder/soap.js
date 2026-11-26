'use strict';

const { XMLParser, XMLValidator } = require('fast-xml-parser');

// The SOAP side of SiteMinder Exchange: SiteMinder pushes OTA_HotelResNotifRQ messages (SOAP 1.1)
// and expects OTA_HotelResNotifRS in the same request
// (https://developer.siteminder.com/smx-api/reference/reservations).
//
// The XML comes from the internet before anything has authenticated it, so it is parsed with
// everything optional switched off: no DTD (a document with a DOCTYPE or an entity declaration is
// refused before the parser sees it), no entity expansion by the parser, a size limit and a depth
// limit. This file lives at the connector root because the plugin can only load files from there.

const MAX_XML_BYTES = 1024 * 1024;
const MAX_DEPTH = 64;

const ATTRIBUTE_PREFIX = '@_';
const TEXT_KEY = '#text';

const WSS_USERNAME_TOKEN_PROFILE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0';
const PASSWORD_TEXT_TYPE = `${WSS_USERNAME_TOKEN_PROFILE}#PasswordText`;
const SOAP_ENVELOPE_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';
const OTA_NAMESPACE = 'http://www.opentravel.org/OTA/2003/05';

// OTA error codes SiteMinder asks for (https://developer.siteminder.com/smx-api/guides/error-handling).
const ERROR_INVALID_CREDENTIALS = { type: '6', code: '497', text: 'Invalid Username and/or Password' };
const ERROR_HOTEL_NOT_FOUND = { type: '6', code: '392' };
const ERROR_REQUIRED_FIELD_MISSING = { type: '10', code: '321' };

// Elements that can repeat. They are always parsed as arrays, so one room and two rooms have the
// same shape.
const ARRAY_ELEMENTS = new Set([
    'HotelReservation', 'Source', 'RoomStay', 'RoomType', 'RatePlan', 'RoomRate', 'Rate', 'Tax',
    'GuestCount', 'GuaranteeAccepted', 'GuaranteePayment', 'AcceptedPayment', 'ResGuestRPH', 'Membership',
    'Comment', 'SpecialRequest', 'Service', 'ServiceCategory', 'ServiceRPH', 'ResGuest', 'ProfileInfo',
    'HotelReservationID', 'AddressLine', 'AdditionalDetail', 'Telephone', 'Email', 'Address',
    'RelatedTraveler', 'CustLoyalty', 'MealsIncluded', 'Text'
]);

// Payment card data never reaches a flow: these elements are dropped from the "reservation" tree
// and are not read by the mapping. SeriesCode is the security code of a card (OTA uses the same
// attribute for the series of a voucher; it is dropped there as well).
const DROPPED_ELEMENTS = new Set(['PaymentCard', 'ThreeDomainSecurity']);
const DROPPED_ATTRIBUTES = new Set(['SeriesCode']);

// Element or attribute names that must never become keys of the object handed to a flow.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const PREDEFINED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };

/**
 * An error the endpoint answers with a SOAP fault instead of an OTA response.
 */
class SoapFaultError extends Error {

    constructor(message) {

        super(message);
        this.name = 'SoapFaultError';
    }
}

/**
 * Decode the five predefined XML entities and numeric character references, in one pass, so
 * "&amp;lt;" becomes "&lt;" and not "<". Nothing else is an entity here: documents that declare
 * their own are refused.
 * @param {string} value
 * @returns {string}
 */
const decodeEntities = (value) => {

    if (typeof value !== 'string' || value.indexOf('&') === -1) {
        return value;
    }
    return value.replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|amp|lt|gt|quot|apos);/g, (match, name) => {
        if (name[0] !== '#') {
            return PREDEFINED_ENTITIES[name];
        }
        const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        // Only characters XML 1.0 allows; anything else stays as written.
        const allowed = code === 0x9 || code === 0xA || code === 0xD
            || (code >= 0x20 && code <= 0xD7FF) || (code >= 0xE000 && code <= 0xFFFD)
            || (code >= 0x10000 && code <= 0x10FFFF);
        return allowed ? String.fromCodePoint(code) : match;
    });
};

const escapeXml = (value) => {

    return String(value === undefined || value === null ? '' : value)
        // Characters XML 1.0 cannot carry at all.
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: ATTRIBUTE_PREFIX,
    textNodeName: TEXT_KEY,
    removeNSPrefix: true,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: true,
    ignoreDeclaration: true,
    ignorePiTags: true,
    processEntities: false,
    htmlEntities: false,
    allowBooleanAttributes: false,
    isArray: (name) => ARRAY_ELEMENTS.has(name),
    tagValueProcessor: (name, value) => decodeEntities(value),
    attributeValueProcessor: (name, value) => decodeEntities(value)
});

const depthOf = (node, depth = 1) => {

    if (!node || typeof node !== 'object') {
        return depth;
    }
    if (depth > MAX_DEPTH) {
        return depth;
    }
    let max = depth;
    for (const value of Array.isArray(node) ? node : Object.values(node)) {
        if (value && typeof value === 'object') {
            max = Math.max(max, depthOf(value, depth + 1));
            if (max > MAX_DEPTH) {
                return max;
            }
        }
    }
    return max;
};

/**
 * Parse an XML document from an untrusted sender.
 * @param {Buffer|string} input
 * @returns {object}
 * @throws {SoapFaultError} when the input is not an acceptable XML document
 */
const parseXml = (input) => {

    if (input === undefined || input === null || input.length === 0) {
        throw new SoapFaultError('The request has no body.');
    }
    const size = Buffer.isBuffer(input) ? input.length : Buffer.byteLength(String(input), 'utf8');
    if (size > MAX_XML_BYTES) {
        throw new SoapFaultError('The request body is too large.');
    }
    let xml = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
    if (xml.charCodeAt(0) === 0xFEFF) {
        xml = xml.slice(1);
    }
    // No DTD of any kind: no entity declarations, no external subset. A reservation has no use
    // for one, and it is how XML bombs and external entities get in.
    if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
        throw new SoapFaultError('The XML document must not contain a DOCTYPE or entity declarations.');
    }
    let valid;
    try {
        valid = XMLValidator.validate(xml, { allowBooleanAttributes: false });
    } catch (err) {
        valid = { err: { msg: 'not well-formed' } };
    }
    if (valid !== true) {
        throw new SoapFaultError('The request body is not well-formed XML.');
    }
    let parsed;
    try {
        parsed = parser.parse(xml);
    } catch (err) {
        throw new SoapFaultError('The request body is not well-formed XML.');
    }
    if (!parsed || typeof parsed !== 'object' || depthOf(parsed) > MAX_DEPTH) {
        throw new SoapFaultError('The XML document is nested too deeply.');
    }
    return parsed;
};

// --- reading the parsed tree -------------------------------------------------------------------

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const list = (value) => {

    if (value === undefined || value === null || value === '') {
        return [];
    }
    return Array.isArray(value) ? value : [value];
};

const first = (value) => list(value)[0];

const attr = (node, name) => {

    if (!isObject(node)) {
        return undefined;
    }
    const value = node[ATTRIBUTE_PREFIX + name];
    return value === undefined || value === null || value === '' ? undefined : String(value);
};

/**
 * The text of an element: its own text, or the text of its <Text> children (OTA wraps free text
 * in <Text>, and some publishers put it straight into the element).
 * @param {*} node
 * @returns {string|undefined}
 */
const text = (node) => {

    const value = Array.isArray(node) ? node[0] : node;
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value === '' ? undefined : value;
    }
    if (typeof value !== 'object') {
        return String(value);
    }
    if (typeof value[TEXT_KEY] === 'string' && value[TEXT_KEY] !== '') {
        return value[TEXT_KEY];
    }
    const parts = list(value.Text).map(item => text(item)).filter(part => part !== undefined);
    return parts.length ? parts.join('\n') : undefined;
};

const number = (value) => {

    if (value === undefined || value === null || String(value).trim() === '') {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const bool = (value) => {

    if (value === undefined || value === null) {
        return undefined;
    }
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
        return true;
    }
    if (normalized === 'false' || normalized === '0') {
        return false;
    }
    return undefined;
};

/**
 * Drop undefined values, empty arrays stay (a list field is always a list).
 * @param {object} source
 * @returns {object}
 */
const compact = (source) => {

    const result = {};
    for (const [key, value] of Object.entries(source)) {
        if (value !== undefined && value !== null) {
            result[key] = value;
        }
    }
    return result;
};

const mapAmount = (node) => {

    if (!isObject(node)) {
        return {};
    }
    return {
        amountBeforeTax: number(attr(node, 'AmountBeforeTax')),
        amountAfterTax: number(attr(node, 'AmountAfterTax')),
        currencyCode: attr(node, 'CurrencyCode'),
        taxAmount: isObject(node.Taxes) ? number(attr(node.Taxes, 'Amount')) : undefined
    };
};

const mapComments = (node) => {

    return list(node && node.Comment).map(comment => text(comment)).filter(value => value !== undefined);
};

const mapSpecialRequests = (node) => {

    return list(node && node.SpecialRequest)
        .map(request => compact({
            code: attr(request, 'RequestCode'),
            name: attr(request, 'Name'),
            text: text(request)
        }))
        .filter(request => Object.keys(request).length > 0);
};

const mapGuestCounts = (node) => {

    const counts = list(node && node.GuestCount);
    if (!counts.length) {
        return {};
    }
    // AgeQualifyingCode: 10 = adult, 8 = child, 7 = infant.
    const sum = (code) => counts
        .filter(count => attr(count, 'AgeQualifyingCode') === code)
        .reduce((total, count) => total + (number(attr(count, 'Count')) || 0), 0);
    return {
        adults: sum('10'),
        children: sum('8'),
        infants: sum('7'),
        guestCount: counts.reduce((total, count) => total + (number(attr(count, 'Count')) || 0), 0)
    };
};

const mapAddress = (node) => {

    const address = first(node);
    if (!isObject(address)) {
        return {};
    }
    const lines = list(address.AddressLine).map(line => text(line)).filter(value => value !== undefined);
    return {
        addressLine: lines.length ? lines.join(', ') : undefined,
        city: text(address.CityName),
        postalCode: text(address.PostalCode),
        state: text(address.StateProv),
        stateCode: attr(address.StateProv, 'StateCode'),
        country: text(address.CountryName),
        countryCode: attr(address.CountryName, 'Code')
    };
};

const mapPhone = (node) => {

    const phones = list(node).filter(isObject);
    const phone = phones.find(item => bool(attr(item, 'DefaultInd')) === true) || phones[0];
    if (!phone) {
        return {};
    }
    return {
        phoneNumber: attr(phone, 'PhoneNumber'),
        phoneCountryAccessCode: attr(phone, 'CountryAccessCode'),
        phoneAreaCityCode: attr(phone, 'AreaCityCode')
    };
};

const mapEmail = (node) => {

    const emails = list(node);
    const preferred = emails.find(item => isObject(item) && bool(attr(item, 'DefaultInd')) === true);
    return text(preferred !== undefined ? preferred : emails[0]);
};

/**
 * A person or company of a reservation, from an OTA <ProfileInfo>.
 * @param {object} profileInfo
 * @returns {object}
 */
const mapProfile = (profileInfo) => {

    if (!isObject(profileInfo)) {
        return {};
    }
    const profile = isObject(profileInfo.Profile) ? profileInfo.Profile : {};
    const customer = isObject(profile.Customer) ? profile.Customer : {};
    const name = isObject(customer.PersonName) ? customer.PersonName : {};
    const company = isObject(profile.CompanyInfo) ? profile.CompanyInfo : {};
    const loyalty = first(customer.CustLoyalty);
    return compact({
        profileId: attr(profileInfo.UniqueID, 'ID'),
        profileType: attr(profile, 'ProfileType'),
        namePrefix: text(name.NamePrefix),
        givenName: text(name.GivenName),
        middleName: text(name.MiddleName),
        surname: text(name.Surname),
        email: mapEmail(customer.Email),
        ...mapPhone(customer.Telephone),
        ...mapAddress(customer.Address),
        birthDate: attr(customer, 'BirthDate'),
        vip: bool(attr(customer, 'VIP_Indicator')),
        loyaltyProgram: attr(loyalty, 'ProgramID'),
        loyaltyMembershipId: attr(loyalty, 'MembershipID'),
        loyaltyLevel: attr(loyalty, 'LoyalLevel'),
        companyName: text(company.CompanyName),
        companyCode: attr(company.CompanyName, 'Code'),
        companyEmail: mapEmail(company.Email)
    });
};

const mapGuest = (resGuest) => {

    const profileInfo = first(resGuest.Profiles && resGuest.Profiles.ProfileInfo);
    return compact({
        rph: attr(resGuest, 'ResGuestRPH'),
        primary: bool(attr(resGuest, 'PrimaryIndicator')),
        arrivalTime: attr(resGuest, 'ArrivalTime'),
        age: number(attr(resGuest, 'Age')),
        ...mapProfile(profileInfo),
        comments: mapComments(resGuest.Comments),
        specialRequests: mapSpecialRequests(resGuest.SpecialRequests)
    });
};

const mapDailyRates = (roomRate) => {

    return list(roomRate && roomRate.Rates && roomRate.Rates.Rate).map(rate => {
        // Base is the room alone, Total includes extras; a publisher may send either.
        const amount = mapAmount(isObject(rate.Base) ? rate.Base : rate.Total);
        return compact({
            effectiveDate: attr(rate, 'EffectiveDate'),
            expireDate: attr(rate, 'ExpireDate'),
            unitMultiplier: number(attr(rate, 'UnitMultiplier')),
            amountBeforeTax: amount.amountBeforeTax,
            amountAfterTax: amount.amountAfterTax,
            currencyCode: amount.currencyCode
        });
    });
};

const mapRoomStay = (roomStay) => {

    const roomType = first(roomStay.RoomTypes && roomStay.RoomTypes.RoomType);
    const ratePlan = first(roomStay.RatePlans && roomStay.RatePlans.RatePlan);
    const roomRate = first(roomStay.RoomRates && roomStay.RoomRates.RoomRate);
    const total = mapAmount(roomStay.Total);
    return compact({
        roomTypeCode: attr(roomType, 'RoomTypeCode') || attr(roomRate, 'RoomTypeCode'),
        roomTypeName: attr(roomType, 'RoomType')
            || attr(roomType && roomType.RoomDescription, 'Name'),
        roomDescription: text(roomType && roomType.RoomDescription),
        roomId: attr(roomType, 'RoomID') || attr(roomRate, 'RoomID'),
        ratePlanCode: attr(ratePlan, 'RatePlanCode') || attr(roomRate, 'RatePlanCode'),
        ratePlanName: attr(ratePlan, 'RatePlanName'),
        ratePlanDescription: text(ratePlan && ratePlan.RatePlanDescription),
        numberOfUnits: number(attr(roomRate, 'NumberOfUnits')),
        arrivalDate: attr(roomStay.TimeSpan, 'Start'),
        departureDate: attr(roomStay.TimeSpan, 'End'),
        ...mapGuestCounts(roomStay.GuestCounts),
        totalAmountBeforeTax: total.amountBeforeTax,
        totalAmountAfterTax: total.amountAfterTax,
        currencyCode: total.currencyCode,
        promotionCode: attr(roomStay, 'PromotionCode'),
        marketCode: attr(roomStay, 'MarketCode'),
        sourceOfBusiness: attr(roomStay, 'SourceOfBusiness'),
        guestRphs: list(roomStay.ResGuestRPHs && roomStay.ResGuestRPHs.ResGuestRPH)
            .map(item => attr(item, 'RPH')).filter(value => value !== undefined),
        dailyRates: mapDailyRates(roomRate),
        comments: mapComments(roomStay.Comments),
        specialRequests: mapSpecialRequests(roomStay.SpecialRequests)
    });
};

const mapService = (service) => {

    const details = isObject(service.ServiceDetails) ? service.ServiceDetails : {};
    const total = mapAmount(service.Price && service.Price.Total);
    return compact({
        rph: attr(service, 'ServiceRPH'),
        id: attr(service, 'ID'),
        inventoryCode: attr(service, 'ServiceInventoryCode'),
        categoryCode: attr(service, 'ServiceCategoryCode'),
        pricingType: attr(service, 'ServicePricingType'),
        quantity: number(attr(service, 'Quantity')),
        inclusive: bool(attr(service, 'Inclusive')),
        description: text(details.ServiceDescription),
        startDate: attr(details.TimeSpan, 'Start'),
        endDate: attr(details.TimeSpan, 'End'),
        amountBeforeTax: total.amountBeforeTax,
        amountAfterTax: total.amountAfterTax,
        currencyCode: total.currencyCode,
        comments: mapComments(details.Comments)
    });
};

/**
 * The parsed tree in a form a flow can walk: attributes and child elements side by side, text as
 * "value". Payment card elements are left out.
 * @param {*} node
 * @returns {*}
 */
const toPlainTree = (node) => {

    if (Array.isArray(node)) {
        return node.map(toPlainTree);
    }
    if (!isObject(node)) {
        return node;
    }
    const result = {};
    for (const [key, value] of Object.entries(node)) {
        if (UNSAFE_KEYS.has(key) || UNSAFE_KEYS.has(key.slice(ATTRIBUTE_PREFIX.length))) {
            continue;
        }
        if (key === TEXT_KEY) {
            result.value = value;
        } else if (key.startsWith(ATTRIBUTE_PREFIX)) {
            const name = key.slice(ATTRIBUTE_PREFIX.length);
            if (!DROPPED_ATTRIBUTES.has(name) && !name.startsWith('xmlns')) {
                result[name] = value;
            }
        } else if (!DROPPED_ELEMENTS.has(key)) {
            result[key] = toPlainTree(value);
        }
    }
    return result;
};

/**
 * One <HotelReservation> as the triggers send it.
 * @param {object} hotelReservation parsed element
 * @param {object} message { echoToken, timestamp }
 * @returns {object}
 */
const mapReservation = (hotelReservation, message = {}) => {

    const source = isObject(hotelReservation) ? hotelReservation : {};
    const global = isObject(source.ResGlobalInfo) ? source.ResGlobalInfo : {};
    const sources = list(source.POS && source.POS.Source).filter(isObject);
    const requestor = sources.map(item => item.RequestorID).find(isObject);
    const channels = sources.map(item => item.BookingChannel).filter(isObject);
    const channel = channels.find(item => bool(attr(item, 'Primary')) === true) || channels[0];

    const roomStays = list(source.RoomStays && source.RoomStays.RoomStay).filter(isObject).map(mapRoomStay);
    const guests = list(source.ResGuests && source.ResGuests.ResGuest).filter(isObject).map(mapGuest);
    const services = list(source.Services && source.Services.Service).filter(isObject).map(mapService);

    const total = mapAmount(global.Total);
    const stayStarts = roomStays.map(stay => stay.arrivalDate).filter(Boolean).sort();
    const stayEnds = roomStays.map(stay => stay.departureDate).filter(Boolean).sort();

    const primaryGuest = guests.find(guest => guest.primary === true) || guests[0];
    const booker = mapProfile(list(global.Profiles && global.Profiles.ProfileInfo)
        .filter(isObject)
        .find(info => isObject(info.Profile) && isObject(info.Profile.Customer)));
    const commission = isObject(global.TotalCommissions) ? global.TotalCommissions.CommissionPayableAmount : undefined;

    // The counts of the whole reservation; when a publisher sends them only per room, add those up.
    let counts = mapGuestCounts(global.GuestCounts);
    if (counts.guestCount === undefined && roomStays.some(stay => stay.guestCount !== undefined)) {
        const add = (field) => roomStays.reduce((sum, stay) => sum + (stay[field] || 0), 0);
        counts = { adults: add('adults'), children: add('children'), infants: add('infants'), guestCount: add('guestCount') };
    }

    const person = (guest) => {
        if (!guest) {
            return undefined;
        }
        // Lists stay with the guest in "guests"; the summary object is flat.
        const rest = { ...guest };
        delete rest.comments;
        delete rest.specialRequests;
        return Object.keys(rest).length ? rest : undefined;
    };

    return compact({
        reservationId: attr(source.UniqueID, 'ID'),
        status: attr(source, 'ResStatus'),
        hotelCode: attr(global.BasicPropertyInfo, 'HotelCode'),
        publisherCode: attr(requestor, 'ID'),
        bookingChannelName: text(channel && channel.CompanyName),
        bookingChannelCode: attr(channel && channel.CompanyName, 'Code'),
        createdAt: attr(source, 'CreateDateTime'),
        lastModifiedAt: attr(source, 'LastModifyDateTime'),
        creatorId: attr(source, 'CreatorID'),
        lastModifierId: attr(source, 'LastModifierID'),
        arrivalDate: attr(global.TimeSpan, 'Start') || stayStarts[0],
        departureDate: attr(global.TimeSpan, 'End') || stayEnds[stayEnds.length - 1],
        ...counts,
        totalAmountBeforeTax: total.amountBeforeTax,
        totalAmountAfterTax: total.amountAfterTax,
        currencyCode: total.currencyCode,
        taxAmount: total.taxAmount,
        commissionAmount: number(attr(commission, 'Amount')),
        commissionCurrencyCode: attr(commission, 'CurrencyCode'),
        primaryGuest: person(primaryGuest),
        booker: Object.keys(booker).length ? booker : undefined,
        hotelReservationIds: list(global.HotelReservationIDs && global.HotelReservationIDs.HotelReservationID)
            .filter(isObject)
            .map(id => compact({
                type: attr(id, 'ResID_Type'),
                value: attr(id, 'ResID_Value'),
                source: attr(id, 'ResID_Source')
            })),
        roomStays,
        guests,
        services,
        comments: mapComments(global.Comments),
        specialRequests: mapSpecialRequests(global.SpecialRequests),
        echoToken: message.echoToken,
        messageTimestamp: message.timestamp,
        reservation: toPlainTree(source)
    });
};

/**
 * Read a pushed SOAP message.
 * @param {Buffer|string} input the request body
 * @returns {{ username: (string|undefined), password: (string|undefined), passwordType: (string|undefined),
 *   echoToken: (string|undefined), timestamp: (string|undefined), version: (string|undefined),
 *   reservations: Array<object> }}
 * @throws {SoapFaultError} when the body is not a SOAP envelope with an OTA_HotelResNotifRQ
 */
const parseNotification = (input) => {

    const document = parseXml(input);
    const envelope = document.Envelope;
    if (!isObject(envelope)) {
        throw new SoapFaultError('The request is not a SOAP envelope.');
    }
    const body = envelope.Body;
    const request = isObject(body) ? body.OTA_HotelResNotifRQ : undefined;
    if (!isObject(request)) {
        throw new SoapFaultError('The SOAP body has no OTA_HotelResNotifRQ.');
    }

    const header = isObject(envelope.Header) ? envelope.Header : {};
    const security = isObject(header.Security) ? header.Security : {};
    const token = isObject(security.UsernameToken) ? security.UsernameToken : {};
    const passwordNode = token.Password;

    const message = {
        echoToken: attr(request, 'EchoToken'),
        timestamp: attr(request, 'TimeStamp')
    };

    return {
        username: text(token.Username),
        password: text(passwordNode),
        passwordType: isObject(passwordNode) ? attr(passwordNode, 'Type') : undefined,
        echoToken: message.echoToken,
        timestamp: message.timestamp,
        version: attr(request, 'Version'),
        reservations: list(request.HotelReservations && request.HotelReservations.HotelReservation)
            .filter(isObject)
            .map(reservation => mapReservation(reservation, message))
    };
};

// --- answers -----------------------------------------------------------------------------------

const envelope = (bodyXml) => {

    return '<?xml version="1.0" encoding="UTF-8"?>'
        + `<SOAP-ENV:Envelope xmlns:SOAP-ENV="${SOAP_ENVELOPE_NAMESPACE}">`
        + '<SOAP-ENV:Header/>'
        + `<SOAP-ENV:Body>${bodyXml}</SOAP-ENV:Body>`
        + '</SOAP-ENV:Envelope>';
};

const responseOpenTag = ({ echoToken, now = new Date() } = {}) => {

    const echo = echoToken === undefined || echoToken === null || echoToken === ''
        ? ''
        : ` EchoToken="${escapeXml(echoToken)}"`;
    return `<OTA_HotelResNotifRS xmlns="${OTA_NAMESPACE}" Version="1.0"${echo} TimeStamp="${now.toISOString()}">`;
};

/**
 * OTA_HotelResNotifRS with <Success/>. SiteMinder requires a reservation ID of the receiving
 * system in the answer; its FAQ says to return the received UniqueID when the application does
 * not create an ID of its own, which is the case here.
 * @param {object} options { echoToken, reservationIds, now }
 * @returns {string}
 */
const successResponse = ({ echoToken, reservationIds = [], now } = {}) => {

    const reservations = reservationIds.map(id => {
        const value = escapeXml(id);
        return '<HotelReservation>'
            + `<UniqueID ID="${value}"/>`
            + '<ResGlobalInfo><HotelReservationIDs>'
            + `<HotelReservationID ResID_Type="10" ResID_Value="${value}"/>`
            + '</HotelReservationIDs></ResGlobalInfo>'
            + '</HotelReservation>';
    }).join('');
    return envelope(responseOpenTag({ echoToken, now })
        + '<Success/>'
        + `<HotelReservations>${reservations}</HotelReservations>`
        + '</OTA_HotelResNotifRS>');
};

/**
 * OTA_HotelResNotifRS with <Errors>. Sent with HTTP 200: SiteMinder treats it as a failed
 * delivery and retries.
 * @param {object} options { echoToken, type, code, text, now }
 * @returns {string}
 */
const errorResponse = ({ echoToken, type, code, text: message, now } = {}) => {

    return envelope(responseOpenTag({ echoToken, now })
        + `<Errors><Error Type="${escapeXml(type)}" Code="${escapeXml(code)}">${escapeXml(message)}</Error></Errors>`
        + '</OTA_HotelResNotifRS>');
};

/**
 * A SOAP 1.1 fault, for a request that is not a readable reservation message at all.
 * @param {object} options { code: 'Client'|'Server', message }
 * @returns {string}
 */
const faultResponse = ({ code = 'Client', message } = {}) => {

    return envelope('<SOAP-ENV:Fault>'
        + `<faultcode>SOAP-ENV:${code === 'Server' ? 'Server' : 'Client'}</faultcode>`
        + `<faultstring xml:lang="en">${escapeXml(message)}</faultstring>`
        + '</SOAP-ENV:Fault>');
};

module.exports = {
    MAX_XML_BYTES,
    MAX_DEPTH,
    PASSWORD_TEXT_TYPE,
    ERROR_INVALID_CREDENTIALS,
    ERROR_HOTEL_NOT_FOUND,
    ERROR_REQUIRED_FIELD_MISSING,
    SoapFaultError,
    decodeEntities,
    escapeXml,
    parseXml,
    parseNotification,
    mapReservation,
    successResponse,
    errorResponse,
    faultResponse
};
