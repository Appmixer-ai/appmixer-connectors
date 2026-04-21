'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'id': { 'type': 'string', 'title': 'Dashboard ID' },
    'displayName': { 'type': 'string', 'title': 'Display Name' },
    'isReadOnly': { 'type': 'boolean', 'title': 'Is Read Only' },
    'embedUrl': { 'type': 'string', 'title': 'Embed URL' },
    'webUrl': { 'type': 'string', 'title': 'Web URL' }
};

module.exports = {

    async receive(context) {

        const { outputType, groupId } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Dashboards' });
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/dashboards`
            : `${BASE_URL}/dashboards`;

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
