'use strict';

module.exports = {

    async receive(context) {

        const {
            datasetName, startTime, endTime, resolution, limit, filterField, filterValue
        } = context.messages.in.content;

        if (!datasetName) {
            throw new context.CancelError('Dataset name is required!');
        }

        if (!startTime) {
            throw new context.CancelError('Start time is required!');
        }

        if (!endTime) {
            throw new context.CancelError('End time is required!');
        }

        if (!resolution) {
            throw new context.CancelError('Resolution is required!');
        }

        const requestBody = {
            startTime,
            endTime,
            resolution
        };

        if (limit !== undefined && limit !== null) {
            requestBody.limit = limit;
        }

        // Add filter if provided
        if (filterField && filterValue) {
            requestBody.filter = {
                op: 'eq',
                field: filterField,
                value: filterValue
            };
        }

        const url = `https://api.axiom.co/v1/datasets/${datasetName}/query`;

        const headers = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            'Content-Type': 'application/json',
            'x-axiom-org-id': context.auth.organizationId
        };

        const { data } = await context.httpRequest({
            method: 'POST',
            url,
            headers,
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
