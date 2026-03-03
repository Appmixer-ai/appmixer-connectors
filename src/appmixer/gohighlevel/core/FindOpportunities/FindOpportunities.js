'use strict';

const lib = require('../../lib');

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

const OPPORTUNITY_SCHEMA = {
    id: { type: 'string', title: 'Opportunity ID' },
    name: { type: 'string', title: 'Name' },
    status: { type: 'string', title: 'Status' },
    pipelineId: { type: 'string', title: 'Pipeline ID' },
    pipelineStageId: { type: 'string', title: 'Pipeline Stage ID' },
    pipelineStageName: { type: 'string', title: 'Pipeline Stage Name' },
    contactId: { type: 'string', title: 'Contact ID' },
    monetaryValue: { type: 'number', title: 'Monetary Value' },
    assignedTo: { type: 'string', title: 'Assigned To' },
    locationId: { type: 'string', title: 'Location ID' },
    createdAt: { type: 'string', title: 'Date Created' },
    updatedAt: { type: 'string', title: 'Date Updated' }
};

module.exports = {

    async receive(context) {

        const { locationId, pipelineId, pipelineStageId, status, assignedTo, query, outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, OPPORTUNITY_SCHEMA, {
                label: 'Opportunities',
                value: 'result'
            });
        }

        if (!locationId) {
            throw new context.CancelError('Location ID is required!');
        }

        const params = {
            location_id: locationId,
            limit: 100
        };

        if (pipelineId) params.pipeline_id = pipelineId;
        if (pipelineStageId) params.pipeline_stage_id = pipelineStageId;
        if (status) params.status = status;
        if (assignedTo) params.assigned_to = assignedTo;
        if (query) params.query = query;

        const response = await context.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/opportunities/search`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            },
            params
        });

        const opportunities = response.data?.opportunities || [];

        if (opportunities.length === 0) {
            return context.sendJson({}, 'notFound');
        }

        return lib.sendArrayOutput({ context, outputType, records: opportunities });
    }
};
