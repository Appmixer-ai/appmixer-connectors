'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, query, impersonatedUserName , groupId } = context.messages.in.content;


        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}/executeQueries`
            : `${BASE_URL}/datasets/${datasetId}/executeQueries`;

        const body = {
            queries: [{ query }],
            serializerSettings: {
                includeNulls: true
            }
        };

        if (impersonatedUserName) {
            body.impersonatedUserName = impersonatedUserName;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        const results = response.data.results || [];
        const tables = results.length > 0 ? (results[0].tables || []) : [];

        return context.sendJson({
            results,
            tables,
            error: response.data.error || null
        }, 'out');
    }
};
