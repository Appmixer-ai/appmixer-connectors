'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const {
            opportunityId,
            name,
            pipelineStageId,
            status,
            monetaryValue,
            assignedTo
        } = context.messages.in.content;

        if (!opportunityId) {
            throw new context.CancelError('Opportunity ID is required!');
        }

        const body = {};

        if (name !== undefined) body.name = name;
        if (pipelineStageId !== undefined) body.pipelineStageId = pipelineStageId;
        if (status !== undefined) body.status = status;
        if (monetaryValue !== undefined) body.monetaryValue = monetaryValue;
        if (assignedTo !== undefined) body.assignedTo = assignedTo;

        const response = await context.httpRequest({
            method: 'PUT',
            url: `${BASE_URL}/opportunities/${opportunityId}`,
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
