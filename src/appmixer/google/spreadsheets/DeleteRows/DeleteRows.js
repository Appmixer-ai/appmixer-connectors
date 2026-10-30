'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

const sheets = google.sheets('v4');
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
