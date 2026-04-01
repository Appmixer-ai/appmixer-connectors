'use strict';
const GoogleApi = require('googleapis');
const commons = require('../../google-commons');
const Promise = require('bluebird');

const calendar = GoogleApi.calendar('v3');
const listEvents = Promise.promisify(calendar.events.list, { context: calendar.events });

module.exports = {

    async receive(context) {

        const { calendarId, startTime, endTime, eventTypes } = context.messages.in.content;

        // Fetch all events in the given time range
        const payload = {
            auth: commons.getOauth2Client(context.auth),
            quotaUser: context.auth.userId,
            calendarId: encodeURIComponent(calendarId),
            timeMin: startTime,
            timeMax: endTime,
            singleEvents: true,
            orderBy: 'startTime'
        };

        let data = await listEvents(payload);
        const items = data.items || [];

        // Filter to events that overlap with [startTime, endTime]
        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();

        // Determine which event types to consider. Default to ['default'] (regular events only).
        // Normalise: eventTypes may be a string (single value mapped from flow) or an array.
        const selectedTypes = eventTypes
            ? (Array.isArray(eventTypes) ? eventTypes : [eventTypes])
            : ['default'];

        // Filter to only the event types the user wants to consider.
        // Events without an eventType field are treated as 'default' (older API responses).
        const regularEvents = items.filter(event => {
            const type = event.eventType || 'default';
            return selectedTypes.includes(type);
        });

        const overlapping = regularEvents.filter(event => {
            const evStart = new Date(event.start.dateTime || event.start.date).getTime();
            const evEnd = new Date(event.end.dateTime || event.end.date).getTime();
            // Overlap condition: evStart < endMs && evEnd > startMs
            return evStart < endMs && evEnd > startMs;
        });

        if (overlapping.length === 0) {
            return context.sendJson({ available: true }, 'out');
        }

        const events = overlapping.map(event => {
            return {
                id: event.id,
                summary: event.summary,
                description: event.description,
                location: event.location,
                start: commons.formatDate(event.start),
                end: commons.formatDate(event.end),
                status: event.status,
                htmlLink: event.htmlLink,
                creator: event.creator,
                organizer: event.organizer
            };
        });

        return context.sendJson({ available: false, events }, 'out');
    }
};
