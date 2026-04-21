'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'id': { 'type': 'string', 'title': 'Report ID' },
    'name': { 'type': 'string', 'title': 'Name' },
    'datasetId': { 'type': 'string', 'title': 'Dataset ID' },
    'embedUrl': { 'type': 'string', 'title': 'Embed URL' },
    'webUrl': { 'type': 'string', 'title': 'Web URL' },
    'reportType': { 'type': 'string', 'title': 'Report Type' }
};

module.exports = {

    async receive(context) {

        const { outputType, groupId } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Reports' });
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/reports`
            : `${BASE_URL}/reports`;

        const response = await context.httpRequest({
            method: 'GET',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const records = response.data.value || [];

        return lib.sendArrayOutput({ context, records, outputType });
    }
};
