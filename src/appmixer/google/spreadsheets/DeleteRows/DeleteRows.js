'use strict';
const { sheets: googleSheets } = require('@googleapis/sheets');
const commons = require('../../google-commons');

const sheets = googleSheets('v4');
const deleteRow = params => sheets.spreadsheets.batchUpdate(params).then(res => res.data);

module.exports = {

    receive(context) {

        return deleteRow({
            auth: commons.getOauth2Client(context.auth),
            spreadsheetId: context.properties.sheetId,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: context.properties.worksheetId.split('/')[0],
                                dimension: 'ROWS',
                                // google indexes rows from 0
                                startIndex: context.messages.in.content.rowStart - 1,
                                endIndex: context.messages.in.content.rowEnd || null
                            }
                        }
                    }
                ]
            }
        }).then(() => {
            return context.sendJson({}, 'deleted');
        });
    }
};
