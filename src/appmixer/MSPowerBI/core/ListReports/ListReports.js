'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'id': { 'type': 'string', 'title': 'Report ID', 'example': 'cfafbeb1-8037-4d0c-896e-a46fb27ff229' },
    'name': { 'type': 'string', 'title': 'Name', 'example': 'Sales Report' },
    'datasetId': { 'type': 'string', 'title': 'Dataset ID', 'example': 'f2c49f57-2e36-4f77-b4e3-5e5f68d68cf2' },
    'embedUrl': { 'type': 'string', 'title': 'Embed URL', 'example': 'https://app.powerbi.com/reportEmbed?reportId=cfafbeb1-8037-4d0c-896e-a46fb27ff229' },
    'webUrl': { 'type': 'string', 'title': 'Web URL', 'example': 'https://app.powerbi.com/groups/me/reports/cfafbeb1-8037-4d0c-896e-a46fb27ff229' },
    'reportType': { 'type': 'string', 'title': 'Report Type', 'example': 'PowerBIReport' }
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
