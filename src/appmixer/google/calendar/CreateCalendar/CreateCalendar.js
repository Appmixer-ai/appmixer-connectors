'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const insertCalendar = params => calendar.calendars.insert(params).then(res => res.data);

/**
 * Component for calendar creation on google calendar.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        if (!context.messages.in.content.summary) {
            throw new context.CancelError('Summary is required!');
        }

        return insertCalendar({
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            resource: {
                summary: context.messages.in.content.summary,
                location: context.messages.in.content.location,
                description: context.messages.in.content.description,
                timeZone: context.messages.in.content.timeZone
            }
        }).then(response => {
            return context.sendJson(response, 'calendar');
        });
    }
};
