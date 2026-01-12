'use strict';

module.exports = {

    async receive(context) {

        const { datasetName, data, dataFormat = 'json', timestampField, timestampFormat, csvDelimiter, csvFields, eventLabels } = context.messages.in.content;

        if (!datasetName) {
            throw new context.CancelError('Dataset name is required!');
        }

        if (!data) {
            throw new context.CancelError('Data is required!');
        }

        const url = `https://api.axiom.co/v1/datasets/${datasetName}/ingest`;

        // Determine content type based on format
        let contentType = 'application/json';
        if (dataFormat === 'csv') {
            contentType = 'text/csv';
        } else if (dataFormat === 'ndjson') {
            contentType = 'application/x-ndjson';
        }

        // Build query parameters
        const params = {};
        if (timestampField) {
            params['timestamp-field'] = timestampField;
        }
        if (timestampFormat) {
            params['timestamp-format'] = timestampFormat;
        }
        if (csvDelimiter) {
            params['csv-delimiter'] = csvDelimiter;
        }

        // Build headers
        const headers = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            'Content-Type': contentType,
            'x-axiom-org-id': context.auth.organizationId
        };

        if (csvFields) {
            headers['X-Axiom-CSV-Fields'] = csvFields;
        }

        if (eventLabels) {
            headers['X-Axiom-Event-Labels'] = eventLabels;
        }

        const { data: responseData } = await context.httpRequest({
            method: 'POST',
            url,
            headers,
            params,
            data
        });

        return context.sendJson(responseData, 'out');
    }
};
