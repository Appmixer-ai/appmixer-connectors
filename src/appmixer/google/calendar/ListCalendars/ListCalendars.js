'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const listCalendars = params => calendar.calendarList.list(params).then(res => res.data);

/**
 * Trigger for GMail when new email appears.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        return listCalendars({
            auth: commons.getOauth2Client(context.auth),
            minAccessRole: 'writer',
            userId: 'me',
            quotaUser: context.auth.userId
        }).then((data) => {
            return context.sendJson(data, 'out');
        });
    }
};

