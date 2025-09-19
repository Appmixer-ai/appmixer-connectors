'use strict';

const lib = require('../../lib.generated');
const schema = {
    type: {
        type: 'string',
        title: 'Type'
    },
    id: {
        type: 'string',
        title: 'Admin Id'
    },
    name: {
        type: 'string',
        title: 'Name'
    },
    email: {
        type: 'string',
        title: 'Email'
    },
    job_title: {
        type: 'string',
        title: 'Job Title'
    },
    away_mode_enabled: {
        type: 'boolean',
        title: 'Away Mode Enabled'
    },
    away_mode_reassign: {
        type: 'boolean',
        title: 'Away Mode Reassign'
    },
    has_inbox_seat: {
        type: 'boolean',
        title: 'Has Inbox Seat'
    },
    team_ids: {
        type: 'array',
        items: {
            type: 'integer'
        },
        title: 'Team IDs'
    }
};

module.exports = {

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Admins' });
        }

        // https://developers.intercom.com/reference#list-admins
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api.intercom.io/admins',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Intercom-Version': '2.14'
            }
        });

        const records = data.admins || [];
        return lib.sendArrayOutput({ context, records, outputType });
    }
};
