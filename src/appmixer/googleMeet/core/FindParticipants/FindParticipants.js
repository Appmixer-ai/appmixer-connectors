
'use strict';

const lib = require('../../lib.generated');
const schema = { 'name': { 'type': 'string', 'title': 'Name' }, 'earliestJoinTime': { 'type': 'string', 'title': 'Earliest Join Time' }, 'latestLeaveTime': { 'type': 'string', 'title': 'Latest Leave Time' }, 'user': { 'type': 'object', 'properties': { 'displayName': { 'type': 'string', 'title': 'User.Display Name' }, 'email': { 'type': 'string', 'title': 'User.Email' } }, 'title': 'User' } };

module.exports = {
    async receive(context) {

        const { conferenceRecord, filter, outputType } = context.messages.in.content || {};

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Participants' });
        }

        if (!conferenceRecord) {
            throw new context.CancelError('Conference record is required!');
        }

        const token = (context.auth && (context.auth.accessToken || context.auth.apiToken)) || context.accessToken;
        if (!token) {
            throw new context.CancelError('Missing access token.');
        }

        // https://developers.google.com/workspace/meet/api/reference/rest/v2/conferenceRecords.participants/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://meet.googleapis.com/v2/conferenceRecords/${encodeURIComponent(conferenceRecord)}/participants`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: { filter }
        });

        const records = data.participants || data.items || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
