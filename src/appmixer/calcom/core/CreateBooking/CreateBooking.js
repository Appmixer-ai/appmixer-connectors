'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            eventTypeId,
            start,
            attendeeName,
            attendeeEmail,
            attendeeTimeZone,
            attendeePhoneNumber,
            attendeeLanguage,
            guests,
            lengthInMinutes,
            bookingFieldsResponses,
            metadata
        } = context.messages.in.content;

        if (!eventTypeId) {
            throw new context.CancelError('Event Type is required!');
        }
        if (!start) {
            throw new context.CancelError('Start is required!');
        }
        if (!attendeeName) {
            throw new context.CancelError('Attendee Name is required!');
        }
        if (!attendeeTimeZone) {
            throw new context.CancelError('Attendee Time Zone is required!');
        }

        const attendee = { name: attendeeName, timeZone: attendeeTimeZone };
        if (attendeeEmail) {
            attendee.email = attendeeEmail;
        }
        if (attendeePhoneNumber) {
            attendee.phoneNumber = attendeePhoneNumber;
        }
        if (attendeeLanguage) {
            attendee.language = attendeeLanguage;
        }

        const data = {
            eventTypeId: lib.toInteger(context, eventTypeId, 'Event Type'),
            start: lib.toIsoDate(context, start, 'Start'),
            attendee
        };
        const guestList = lib.parseList(guests);
        if (guestList.length) {
            data.guests = guestList;
        }
        const length = lib.toInteger(context, lengthInMinutes, 'Length (Minutes)');
        if (length) {
            data.lengthInMinutes = length;
        }
        const responses = lib.parseJsonInput(context, bookingFieldsResponses, 'Booking Field Responses');
        if (responses) {
            data.bookingFieldsResponses = responses;
        }
        const meta = lib.parseJsonInput(context, metadata, 'Metadata');
        if (meta) {
            data.metadata = meta;
        }

        const body = await lib.request(context, {
            method: 'POST',
            path: '/v2/bookings',
            version: lib.API_VERSIONS.bookings,
            data
        });

        return context.sendJson(lib.firstBooking(body.data), 'out');
    }
};
