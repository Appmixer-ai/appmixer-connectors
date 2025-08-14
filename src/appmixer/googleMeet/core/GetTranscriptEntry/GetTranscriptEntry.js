
'use strict';
module.exports = {
    async receive(context) {

        const { conferenceRecord, transcript, entry } = context.messages.in.content || {};
        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }
        if (!transcript) {
            throw new context.CancelError('Transcript is required!');
        }
        if (!entry) {
            throw new context.CancelError('Entry is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts.entries/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/transcripts/${encodeURIComponent(transcript)}/entries/${encodeURIComponent(entry)}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
