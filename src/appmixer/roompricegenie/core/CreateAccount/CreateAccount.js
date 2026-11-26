'use strict';

const crypto = require('crypto');
const lib = require('../../lib');

const EVENT = 'account.create';

const REQUIRED = [
    ['propertyCode', 'Property Code'],
    ['hotelName', 'Hotel Name'],
    ['hotelCountryCode', 'Country Code'],
    ['ownerEmail', 'Owner Email'],
    ['ownerFirstName', 'Owner First Name']
];

// account.create (https://postman.roompricegenie.com/#e1a6e7f7-f7be-48e0-ae2b-324e83d37129).
// Authenticated with the Partner API Key alone: the property has no credentials yet, they are in
// the answer. RoomPriceGenie emails the owner an activation link that is valid for 48 hours.
module.exports = {

    async receive(context) {

        const input = context.messages.in.content;

        for (const [field, label] of REQUIRED) {
            if (lib.isEmpty(input[field])) {
                throw new context.CancelError(`${label} is required!`);
            }
        }
        const read = (value) => String(value).trim();

        const countryCode = read(input.hotelCountryCode).toUpperCase();
        if (!/^[A-Z]{2}$/.test(countryCode)) {
            throw new context.CancelError('Country Code must be a two-letter ISO 3166-1 code, for example GB.');
        }
        const data = {
            hotel_name: read(input.hotelName),
            hotel_country_code: countryCode,
            owner_email: read(input.ownerEmail),
            owner_first_name: read(input.ownerFirstName)
        };

        for (const [field, key] of [['hotelAddress', 'hotel_address'], ['hotelPostcode', 'hotel_postcode'],
            ['hotelTimezone', 'hotel_timezone'], ['ownerLanguage', 'owner_language'], ['ownerLastName', 'owner_last_name']]) {
            if (!lib.isEmpty(input[field])) {
                data[key] = read(input[field]);
            }
        }
        if (!lib.isEmpty(input.hotelCurrencyCode)) {
            const currency = read(input.hotelCurrencyCode).toUpperCase();
            if (!/^[A-Z]{3}$/.test(currency)) {
                throw new context.CancelError('Currency Code must be a three-letter ISO 4217 code, for example GBP.');
            }
            data.hotel_currency_code = currency;
        }
        if (lib.isEmpty(input.latitude) !== lib.isEmpty(input.longitude)) {
            throw new context.CancelError('Fill in both Latitude and Longitude, or neither.');
        }
        if (!lib.isEmpty(input.latitude)) {
            const latitude = Number(input.latitude);
            const longitude = Number(input.longitude);
            if (!Number.isFinite(latitude) || Math.abs(latitude) > 90
                || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
                throw new context.CancelError('Latitude must be between -90 and 90 and Longitude between -180 and 180.');
            }
            data.hotel_coordinates = [latitude, longitude];
        }

        const body = {
            event: EVENT,
            tracking_id: crypto.randomUUID(),
            property_code: read(input.propertyCode),
            data
        };
        const response = await lib.request(context, {
            method: 'POST',
            url: lib.apiUrl(context, lib.ACCOUNT_PATH),
            headers: { 'Content-Type': 'application/json' },
            data: body,
            bearer: false
        });

        const envelope = lib.eventResult(context, body, response);
        const answer = lib.isPlainObject(response.data && response.data.data) ? response.data.data : {};
        const credentials = lib.isPlainObject(answer.credentials) ? answer.credentials : {};
        if (lib.isEmpty(credentials.client_id) || lib.isEmpty(credentials.client_secret)) {
            throw new Error('RoomPriceGenie accepted the request but returned no credentials.');
        }
        return context.sendJson({
            ...envelope,
            message: typeof answer.message === 'string' ? answer.message : '',
            client_id: credentials.client_id,
            client_secret: credentials.client_secret
        }, 'out');
    }
};
