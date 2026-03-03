'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const {
            pipelineId,
            locationId,
            name,
            pipelineStageId,
            status,
            contactId,
            monetaryValue,
            assignedTo
        } = context.messages.in.content;

        if (!pipelineId) {
            throw new context.CancelError('Pipeline ID is required!');
        }

        if (!locationId) {
            throw new context.CancelError('Location ID is required!');
        }

        if (!name) {
            throw new context.CancelError('Opportunity Name is required!');
        }

        if (!pipelineStageId) {
            throw new context.CancelError('Pipeline Stage ID is required!');
        }

        if (!status) {
            throw new context.CancelError('Status is required!');
        }

        if (!contactId) {
            throw new context.CancelError('Contact ID is required!');
        }

        const body = {
            pipelineId,
            locationId,
            name,
            pipelineStageId,
            status,
            contactId
        };

        if (monetaryValue !== undefined) body.monetaryValue = monetaryValue;
        if (assignedTo) body.assignedTo = assignedTo;

        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/opportunities/`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Version': API_VERSION
            },
            data: body
        });

        return context.sendJson(response.data.opportunity, 'out');
    }
};
