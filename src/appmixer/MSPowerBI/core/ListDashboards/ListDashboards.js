'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'id': { 'type': 'string', 'title': 'Dashboard ID', 'example': '69fdaa6c-b36d-4d01-96f5-1ed67c64d4af' },
    'displayName': { 'type': 'string', 'title': 'Display Name', 'example': 'Sales Dashboard' },
    'isReadOnly': { 'type': 'boolean', 'title': 'Is Read Only', 'example': false },
    'embedUrl': { 'type': 'string', 'title': 'Embed URL', 'example': 'https://app.powerbi.com/dashboardEmbed?dashboardId=69fdaa6c-b36d-4d01-96f5-1ed67c64d4af' },
    'webUrl': { 'type': 'string', 'title': 'Web URL', 'example': 'https://app.powerbi.com/groups/me/dashboards/69fdaa6c-b36d-4d01-96f5-1ed67c64d4af' }
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
