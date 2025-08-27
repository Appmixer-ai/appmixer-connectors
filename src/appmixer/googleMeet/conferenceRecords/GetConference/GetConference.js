'use strict';

module.exports = {
    async receive(context) {

        const { name } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Conference Record ID is required!');
        }

        // Extract space ID if full resource name is provided
        const conferenceRecordId = name.startsWith('conferenceRecords/') ? name.split('/')[1] : name;

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${conferenceRecordId}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
