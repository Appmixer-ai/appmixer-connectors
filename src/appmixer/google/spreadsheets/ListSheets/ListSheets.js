'use strict';
const commons = require('../../google-commons');
const { google } = require('googleapis');

const drive = google.drive('v3');
const listFiles = params => drive.files.list(params).then(res => res.data);

const listSheets = async function(args, sheets = [], nextPageToken = null) {

    const result = await listFiles(Object.assign(args, nextPageToken ? { pageToken: nextPageToken } : {}));
    if (result.files) {
        sheets = sheets.concat(result.files);
    }
    if (result.nextPageToken) {
        return listSheets(args, sheets, result.nextPageToken);
    }
    return sheets;
};

/**
 * ListSheets
 * @extends {Component}
 */
module.exports = {

    async receive(context) {

        const sheets = await listSheets({
            auth: commons.getOauth2Client(context.auth),
            q: 'mimeType=\'application/vnd.google-apps.spreadsheet\'',
            pageSize: 1000
        });
        return context.sendJson(sheets, 'out');
    },

    /**
     * @param {Array} files
     */
    sheetsToSelectArray(files) {

        const transformed = [];

        if (Array.isArray(files)) {
            files.forEach((sheetItem) => {

                transformed.push({
                    label: sheetItem.name,
                    value: sheetItem.id
                });
            });
        }

        return transformed;
    }
};
