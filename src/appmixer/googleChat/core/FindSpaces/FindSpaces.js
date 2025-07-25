
'use strict';

const lib = require('../../lib.generated');

// Schema for a single space item
const spaceSchema = {
    name: { type: 'string', title: 'Name' },
    displayName: { type: 'string', title: 'Display Name' },
    type: { type: 'string', title: 'Type' },
    spaceType: { type: 'string', title: 'Space Type' },
    singleUserBotDm: { type: 'boolean', title: 'Single User Bot DM' },
    threaded: { type: 'boolean', title: 'Threaded' },
    spaceDetails: {
        type: 'object',
        properties: {
            description: { type: 'string', title: 'Space Details.Description' },
            guidelines: { type: 'string', title: 'Space Details.Guidelines' }
        },
        title: 'Space Details'
    },
    spaceHistoryState: { type: 'string', title: 'Space History State' },
    importMode: { type: 'boolean', title: 'Import Mode' },
    createTime: { type: 'string', title: 'Create Time' },
    adminInstalled: { type: 'boolean', title: 'Admin Installed' },
    accessSettings: {
        type: 'object',
        properties: {
            accessState: { type: 'string', title: 'Access Settings.Access State' },
            audience: { type: 'string', title: 'Access Settings.Audience' }
        },
        title: 'Access Settings'
    },
    spaceUri: { type: 'string', title: 'Space URI' }
};

module.exports = {
    async receive(context) {
        
        const { query, outputType } = context.messages.in.content;
        
        // Generate output port schema dynamically based on the outputType
        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, spaceSchema, { label: 'Spaces' });
        }
        
        const params = {};
        if (query) {
            params.filter = query;
        }
        
        // https://developers.google.com/workspace/chat/api/reference/rest/v1/spaces/list
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://chat.googleapis.com/v1/spaces',
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`
            },
            params: params
        });
        
        const spaces = data.spaces || [];
        
        if (spaces.length === 0) {
            return context.sendJson({}, 'notFound');
        }
        
        return lib.sendArrayOutput({ context, records: spaces, outputType });
    }
};
