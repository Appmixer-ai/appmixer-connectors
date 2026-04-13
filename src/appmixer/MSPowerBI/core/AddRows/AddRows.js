'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, tableName, rows } = context.messages.in.content;
        const { groupId } = context.properties;

        // Parse rows if provided as a string
        let parsedRows;
        if (typeof rows === 'string') {
            try {
                parsedRows = JSON.parse(rows);
            } catch (e) {
                throw new context.CancelError(`Invalid JSON for rows: ${e.message}`);
            }
        } else {
            parsedRows = rows;
        }

        if (!Array.isArray(parsedRows)) {
            throw new context.CancelError('Rows must be a JSON array.');
        }

        const url = groupId
            ? `${BASE_URL}/groups/${groupId}/datasets/${datasetId}/tables/${encodeURIComponent(tableName)}/rows`
            : `${BASE_URL}/datasets/${datasetId}/tables/${encodeURIComponent(tableName)}/rows`;

        await context.httpRequest({
            method: 'POST',
            url,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json'
            },
            data: { rows: parsedRows }
        });

        return context.sendJson({
            status: 'success',
            datasetId,
            tableName,
            rowsAdded: parsedRows.length
        }, 'out');
    }
};
