'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

// Google API client & helpers resolving to the response body for convenience
const calendar = google.calendar('v3');
const insertEvent = params => calendar.events.insert(params).then(res => res.data);

function isDate(param) {

    return param.match('^[0-9]{4}-[0|1][0-9]-[0-3][0-9]$');
}

/**
 * @param {Object} inputJson
 * @return {Object}
 */
function buildEvent(inputJson) {

    let start = isDate(inputJson.start) ?
        { date: inputJson.start } : { dateTime: inputJson.start };
    let end = isDate(inputJson.end) ?
        { date: inputJson.end } : { dateTime: inputJson.end };

    return {
        'summary': inputJson.summary,
        'start': start,
        'end': end,
        'description': inputJson.description,
        'location': inputJson.location
    };
}

/**
 * Component for event creation on google calendar.
 * @extends {Component}
 */
module.exports = {

    receive(context) {

        const { calendarId, start, end } = context.messages.in.content;
        if (!calendarId) {
            throw new context.CancelError('Calendar is required!');
        }
        if (!start) {
            throw new context.CancelError('Start time is required!');
        }
        if (!end) {
            throw new context.CancelError('End time is required!');
        }

        return insertEvent({
            auth: commons.getOauth2Client(context.auth),
            userId: 'me',
            quotaUser: context.auth.userId,
            calendarId: context.messages.in.content.calendarId,
            resource: buildEvent(context.messages.in.content)
        }).then(result => {
            result.start = commons.formatDate(result.start);
            result.end = commons.formatDate(result.end);
            return context.sendJson(
                Object.assign(
                    { calendarId: context.messages.in.content.calendarId },
                    result),
                'event');
        });
    }
};
