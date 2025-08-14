
'use strict';
module.exports = {
    async receive(context) {

        const { name } = context.messages.in.content || {};
        if (!name) {
            throw new context.CancelError('Name is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords/get
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(name)}`,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return context.sendJson(data, 'out');
    }
};
