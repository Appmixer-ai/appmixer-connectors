'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');

/**
 * This component lists all events in google calendar.
 * @extends {Component}
 */
module.exports = {

    receive(context) {
        const { calendarId } = context.properties;

        if (!calendarId) {
            return context.sendJson({}, 'out');
        }

        const listEvents = params => calendar.events.list(params).then(res => res.data);

        return listEvents({
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            calendarId
        }).then(data => {
            return context.sendJson(data, 'out');
        });
    }
};
