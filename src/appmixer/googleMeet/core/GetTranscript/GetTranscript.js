
'use strict';

const lib = require('../../lib.generated');
module.exports = {
    async receive(context) {

        const { conferenceRecord, transcript } = context.messages.in.content;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.transcripts/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: '/v2/conferenceRecords/{conferenceRecord}/transcripts/{transcript}',
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
