'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'name': { 'type': 'string', 'title': 'Name' },
    'columns': { 'type': 'array', 'title': 'Columns' },
    'rows': { 'type': 'array', 'title': 'Rows' },
    'measures': { 'type': 'array', 'title': 'Measures' }
};

module.exports = {

    async receive(context) {

        const { datasetId, outputType , groupId } = context.messages.in.content;


        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Tables' });
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}/tables`
            : `${BASE_URL}/datasets/${datasetId}/tables`;

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
