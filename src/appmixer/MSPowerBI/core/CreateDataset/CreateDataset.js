'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { name, defaultMode, tables, groupId } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Dataset name is required!');
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets`
            : `${BASE_URL}/datasets`;

        let parsedTables = [];
        const tableRows = Array.isArray(tables?.ADD) ? tables.ADD : (Array.isArray(tables) ? tables : []);
        parsedTables = tableRows.map(t => ({
            name: t.name,
            columns: typeof t.columns === 'string' ? JSON.parse(t.columns) : (t.columns || [])
        }));

        const body = {
            name,
            defaultMode: defaultMode || 'Push',
            tables: parsedTables
        };

        const response = await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: body
        });

        const dataset = response.data;

        return context.sendJson({
            status: 'created',
            datasetId: dataset.id,
            datasetName: dataset.name,
            defaultMode: dataset.defaultMode
        }, 'out');
    }
};
