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

        const body = {
            pipelineId,
            locationId,
            name,
            pipelineStageId,
            status,
            contactId
        };

        if (monetaryValue !== undefined) body.monetaryValue = monetaryValue;
        if (assignedTo !== undefined) body.assignedTo = assignedTo;

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
