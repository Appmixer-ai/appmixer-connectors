'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const deleteEvent = params => calendar.events.delete(params).then(res => res.data);

/**
 * Component for event deletion on google calendar.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        const { calendarId, eventId } = context.messages.in.content;
        if (!calendarId) {
            throw new context.CancelError('Calendar is required!');
        }
        if (!eventId) {
            throw new context.CancelError('Event is required!');
        }

        return deleteEvent({
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            calendarId: context.messages.in.content.calendarId,
            eventId: context.messages.in.content.eventId
        }).then(() => {
            return context.sendJson({ eventId: context.messages.in.content.eventId }, 'deleted');
        });
    }
};
