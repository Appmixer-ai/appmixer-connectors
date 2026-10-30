'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const patchEvent = params => calendar.events.patch(params).then(res => res.data);

/**
 * Component for accepting a calendar event invitation on Google Calendar.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        const { calendarId, eventId, attendeeEmail, sendUpdates } = context.messages.in.content;

        if (!calendarId) {
            throw new context.CancelError('Calendar is required!');
        }
        if (!eventId) {
            throw new context.CancelError('Event is required!');
        }
        if (!attendeeEmail) {
            throw new context.CancelError('Attendee Email is required!');
        }

        const params = {
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            calendarId: calendarId,
            eventId: eventId,
            resource: {
                attendees: [
                    {
                        email: attendeeEmail,
                        responseStatus: 'accepted'
                    }
                ]
            }
        };

        if (sendUpdates) {
            params.sendUpdates = sendUpdates;
        }

        return patchEvent(params).then(result => {
            return context.sendJson(
                Object.assign({ calendarId }, result),
                'out'
            );
        });
    }
};
