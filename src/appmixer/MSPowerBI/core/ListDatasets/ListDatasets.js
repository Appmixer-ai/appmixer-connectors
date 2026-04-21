'use strict';

const lib = require('../../lib');
const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

const schema = {
    'id': { 'type': 'string', 'title': 'ID', 'example': 'cfafbeb1-8037-4d0c-896e-a46fb27ff229' },
    'name': { 'type': 'string', 'title': 'Name', 'example': 'Sales Data' },
    'addRowsAPIEnabled': { 'type': 'boolean', 'title': 'Add Rows API Enabled', 'example': true },
    'configuredBy': { 'type': 'string', 'title': 'Configured By', 'example': 'john@example.com' },
    'isRefreshable': { 'type': 'boolean', 'title': 'Is Refreshable', 'example': true },
    'isEffectiveIdentityRequired': { 'type': 'boolean', 'title': 'Is Effective Identity Required', 'example': false },
    'isEffectiveIdentityRolesRequired': { 'type': 'boolean', 'title': 'Is Effective Identity Roles Required', 'example': false },
    'isOnPremGatewayRequired': { 'type': 'boolean', 'title': 'Is On-Prem Gateway Required', 'example': false }
};

module.exports = {

    async receive(context) {

        const { outputType , groupId } = context.messages.in.content;


        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, schema, { label: 'Datasets' });
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets`
            : `${BASE_URL}/datasets`;

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
