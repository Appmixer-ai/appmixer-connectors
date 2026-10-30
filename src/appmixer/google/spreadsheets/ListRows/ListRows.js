'use strict';
const { google } = require('googleapis');
const commons = require('../../google-commons');

const sheets = google.sheets('v4');
const listRows = params => sheets.spreadsheets.values.get(params).then(res => res.data);

module.exports = {

    receive(context) {

        const worksheetName = context.properties.worksheetId.split('/')[1];
        return listRows({
            auth: commons.getOauth2Client(context.auth),
            spreadsheetId: context.properties.sheetId,
            range: worksheetName
        }).then(res => {
            return context.sendJson(res['values'], 'out');
        });
    }
};
