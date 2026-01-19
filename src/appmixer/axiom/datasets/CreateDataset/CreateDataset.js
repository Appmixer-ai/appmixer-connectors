'use strict';

module.exports = {

    async receive(context) {

        const { name, description, kind, retentionDays, useRetentionPeriod, region } = context.messages.in.content;

        if (!name) {
            throw new context.CancelError('Dataset name is required!');
        }

        const requestBody = { name };

        if (description) {
            requestBody.description = description;
        }

        if (kind) {
            requestBody.kind = kind;
        }

        if (retentionDays !== undefined && retentionDays !== null) {
            requestBody.retentionDays = retentionDays;
        }

        if (useRetentionPeriod !== undefined && useRetentionPeriod !== null) {
            requestBody.useRetentionPeriod = useRetentionPeriod;
        }

        if (region) {
            requestBody.region = region;
        }

        const headers = {
            'Authorization': `Bearer ${context.auth.apiToken}`,
            'Content-Type': 'application/json',
            'x-axiom-org-id': context.auth.organizationId
        };

        const { data } = await context.httpRequest({
            method: 'POST',
            url: 'https://api.axiom.co/v2/datasets',
            headers,
            data: requestBody
        });

        return context.sendJson(data, 'out');
    }
};
