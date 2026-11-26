'use strict';

const lib = require('../../lib');

// The same booking contract as Get Booking, Create Booking, Cancel, Reschedule and Confirm.
const ITEM_SCHEMA = {
    type: 'object',
    required: ['id', 'uid', 'title', 'status', 'start', 'end', 'duration', 'eventTypeId', 'hosts', 'attendees', 'createdAt'],
    properties: {
        id: { type: 'integer', title: 'Booking ID', example: 4567890 },
        uid: { type: 'string', title: 'Booking UID', example: 'k3b7Xq9ZpR2mN8vT4wYc1a' },
        title: { type: 'string', title: 'Title', example: '30 Min Meeting between Jane Doe and John Smith' },
        description: { type: 'string', title: 'Description', example: 'Quarterly planning call.' },
        status: { type: 'string', title: 'Status', example: 'accepted' },
        start: { type: 'string', title: 'Start', example: '2026-12-01T09:00:00.000Z', format: 'date-time' },
        end: { type: 'string', title: 'End', example: '2026-12-01T09:30:00.000Z', format: 'date-time' },
        duration: { type: 'integer', title: 'Duration (Minutes)', example: 30 },
        eventTypeId: { type: 'integer', title: 'Event Type ID', example: 1234567 },
        eventType: {
            type: 'object',
            title: 'Event Type',
            properties: {
                id: { type: 'integer', title: 'Event Type.ID', example: 1234567 },
                slug: { type: 'string', title: 'Event Type.Slug', example: '30min' }
            }
        },
        location: { type: 'string', title: 'Location', example: 'https://app.cal.com/video/k3b7Xq9ZpR2mN8vT4wYc1a' },
        meetingUrl: { type: 'string', title: 'Meeting URL', example: 'https://app.cal.com/video/k3b7Xq9ZpR2mN8vT4wYc1a' },
        absentHost: { type: 'boolean', title: 'Absent Host', example: false },
        hosts: {
            type: 'array',
            title: 'Hosts',
            example: [
                {
                    id: 112233,
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    username: 'jane',
                    timeZone: 'Europe/Prague'
                }
            ],
            items: {
                type: 'object',
                properties: {
                    id: { type: 'integer', title: 'Hosts.ID', example: 112233 },
                    name: { type: 'string', title: 'Hosts.Name', example: 'Jane Doe' },
                    email: { type: 'string', title: 'Hosts.Email', example: 'jane@example.com' },
                    username: { type: 'string', title: 'Hosts.Username', example: 'jane' },
                    timeZone: { type: 'string', title: 'Hosts.Time Zone', example: 'Europe/Prague' }
                }
            }
        },
        attendees: {
            type: 'array',
            title: 'Attendees',
            example: [
                {
                    name: 'John Smith',
                    email: 'john@example.com',
                    timeZone: 'America/New_York',
                    language: 'en',
                    absent: false
                }
            ],
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string', title: 'Attendees.Name', example: 'John Smith' },
                    email: { type: 'string', title: 'Attendees.Email', example: 'john@example.com' },
                    timeZone: { type: 'string', title: 'Attendees.Time Zone', example: 'America/New_York' },
                    language: { type: 'string', title: 'Attendees.Language', example: 'en' },
                    phoneNumber: { type: 'string', title: 'Attendees.Phone Number', example: '+14155552671' },
                    absent: { type: 'boolean', title: 'Attendees.Absent', example: false }
                }
            }
        },
        guests: {
            type: 'array',
            title: 'Guests',
            items: { type: 'string' },
            example: ['guest@example.com']
        },
        cancellationReason: { type: 'string', title: 'Cancellation Reason', example: 'The attendee can no longer attend.' },
        cancelledByEmail: { type: 'string', title: 'Cancelled By Email', example: 'john@example.com' },
        reschedulingReason: { type: 'string', title: 'Rescheduling Reason', example: 'Moved to the afternoon.' },
        rescheduledByEmail: { type: 'string', title: 'Rescheduled By Email', example: 'john@example.com' },
        rescheduledFromUid: { type: 'string', title: 'Rescheduled From UID', example: 'h2c6Wp8YoQ1lM7uS3vXb0z' },
        rescheduledToUid: { type: 'string', title: 'Rescheduled To UID', example: 'p4d8Zr0AqS3nO9wU5xYe2b' },
        recurringBookingUid: { type: 'string', title: 'Recurring Booking UID', example: '6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f' },
        createdAt: { type: 'string', title: 'Created At', example: '2026-11-16T10:15:00.000Z', format: 'date-time' },
        updatedAt: { type: 'string', title: 'Updated At', example: '2026-11-16T10:15:00.000Z', format: 'date-time' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const {
            status,
            attendeeEmail,
            attendeeName,
            eventTypeId,
            afterStart,
            beforeEnd,
            afterCreatedAt,
            beforeCreatedAt,
            sortStart,
            outputType
        } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Bookings', value: 'result' });
        }

        const params = {};
        if (status) {
            params.status = status;
        }
        if (attendeeEmail) {
            params.attendeeEmail = attendeeEmail;
        }
        if (attendeeName) {
            params.attendeeName = attendeeName;
        }
        if (eventTypeId) {
            params.eventTypeId = String(lib.toInteger(context, eventTypeId, 'Event Type'));
        }
        if (afterStart) {
            params.afterStart = lib.toIsoDate(context, afterStart, 'Starts After');
        }
        if (beforeEnd) {
            params.beforeEnd = lib.toIsoDate(context, beforeEnd, 'Ends Before');
        }
        if (afterCreatedAt) {
            params.afterCreatedAt = lib.toIsoDate(context, afterCreatedAt, 'Created After');
        }
        if (beforeCreatedAt) {
            params.beforeCreatedAt = lib.toIsoDate(context, beforeCreatedAt, 'Created Before');
        }
        if (sortStart) {
            params.sortStart = sortStart;
        }

        const bookings = await lib.findBookings(context, params);

        if (bookings.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: bookings });
    }
};
