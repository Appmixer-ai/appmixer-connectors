'use strict';

const BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

module.exports = {

    async receive(context) {

        const { datasetId, tableName, rowData, groupId } = context.messages.in.content;

        let parsedRows;

        if (rowData && Array.isArray(rowData.ADD) && rowData.ADD.length > 0) {
            const rowObj = {};
            for (const col of rowData.ADD) {
                const colName = String(col.column || '').trim();
                if (colName) {
                    rowObj[colName] = col.value;
                }
            }
            parsedRows = [rowObj];
        } else if (typeof rowData === 'string') {
            try {
                parsedRows = JSON.parse(rowData);
            } catch (e) {
                throw new context.CancelError(`Invalid JSON for rowData: ${e.message}`);
            }
        } else if (Array.isArray(rowData)) {
            parsedRows = rowData;
        } else {
            throw new context.CancelError('No rows provided.');
        }

        if (!Array.isArray(parsedRows) || parsedRows.length === 0) {
            throw new context.CancelError('Rows must be a non-empty array.');
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
