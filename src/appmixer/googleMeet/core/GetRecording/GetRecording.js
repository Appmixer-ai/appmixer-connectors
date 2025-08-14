
'use strict';
module.exports = {
    async receive(context) {

        const { conferenceRecord, recording } = context.messages.in.content || {};
        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }
        if (!recording) {
            throw new context.CancelError('Recording is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.recordings/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/recordings/${encodeURIComponent(recording)}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
