'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const deleteCalendar = params => calendar.calendars.delete(params).then(res => res.data);

/**
 * Component for calendar deletion.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        if (!context.messages.in.content.calendarId) {
            throw new context.CancelError('Calendar is required!');
        }

        return deleteCalendar({
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            calendarId: context.messages.in.content.calendarId
        }).then(() => {
            return context.sendJson({ calendarId: context.messages.in.content.calendarId }, 'deleted');
        });
    }
};
