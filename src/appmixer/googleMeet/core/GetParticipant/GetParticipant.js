
'use strict';
module.exports = {
    async receive(context) {

        const { conferenceRecord, participant } = context.messages.in.content || {};
        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }
        if (!participant) {
            throw new context.CancelError('Participant is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.participants/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/participants/${encodeURIComponent(participant)}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
