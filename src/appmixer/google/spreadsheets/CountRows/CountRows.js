'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

const sheets = google.sheets('v4');
const findRow = params => sheets.spreadsheets.values.get(params).then(res => res.data);

module.exports = {

    receive(context) {

        const worksheetName = context.messages.in.content.worksheetId.split('/')[1];
        return findRow({
            auth: commons.getOauth2Client(context.auth),
            spreadsheetId: context.properties.sheetId,
            range: worksheetName,
            majorDimension: 'ROWS'
        }).then(res => {
            const row = {
                count: res.values ? res.values.length : 0
            };
            return context.sendJson(row, 'rowCount');
        });
    }
};
