'use strict';

const lib = require('../../lib');

const schema = {
    'id': { 'type': 'string', 'title': 'Id' },
    'name': { 'type': 'string', 'title': 'Name' },
    'description': { 'type': 'string', 'title': 'Description' },
    'inbox_count': { 'type': 'number', 'title': 'Inbox Count' },
    'teammate_count': { 'type': 'number', 'title': 'Teammate Count' }
};

module.exports = {
    async receive(context) {
        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Teams', value: 'teams' });
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://api2.frontapp.com/teams',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            }
        });

        return lib.sendArrayOutput({ context, records: data._results, outputType });
    }
};
