'use strict';

const { sendArrayOutput } = require('../../lib');

module.exports = {

    async receive(context) {

        const generateOutputPortOptions = context.properties.generateOutputPortOptions;
        const {
            outputType = 'array',
            status,
            title,
            requester,
            approver,
            limit = 100
        } = context.messages.in.content;

        if (generateOutputPortOptions) {
            return this.getOutputPortOptions(context, outputType);
        }

        // Build query parameters
        const queryParams = new URLSearchParams();

        if (status && status !== 'all') {
            queryParams.append('status', status);
        }

        if (title) {
            queryParams.append('title', title);
        }

        if (requester) {
            queryParams.append('requester', requester);
        }

        if (approver) {
            queryParams.append('approver', approver);
        }

        queryParams.append('limit', limit.toString());

        // Make HTTP request to the tasks API
        const response = await context.callAppmixer({
            method: 'GET',
            endPoint: `/plugins/appmixer/slack/tasks?${queryParams.toString()}`,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Transform tasks to include human-readable date
        const transformedTasks = response.map(task => {
            // Add human-readable decision by date
            if (task.decisionBy) {
                const decisionByDate = new Date(task.decisionBy);
                task.decisionByReadable = decisionByDate.toLocaleString();
            }

            return task;
        });

        return sendArrayOutput({ context, outputPortName: 'out', outputType, records: transformedTasks });
    },

    getOutputPortOptions(context, outputType) {
        if (outputType === 'object' || outputType === 'first') {
            return context.sendJson([
                { label: 'Task ID', value: 'taskId', schema: { type: 'string' } },
                { label: 'Title', value: 'title', schema: { type: 'string' } },
                { label: 'Description', value: 'description', schema: { type: 'string' } },
                { label: 'Status', value: 'status', schema: { type: 'string' } },
                { label: 'Requester', value: 'requester', schema: { type: 'string' } },
                { label: 'Approver', value: 'approver', schema: { type: 'string' } },
                { label: 'Channel', value: 'channel', schema: { type: 'string' } },
                { label: 'Decision By', value: 'decisionBy', schema: { type: 'string' } },
                { label: 'Decision By (Human Readable)', value: 'decisionByReadable', schema: { type: 'string' } },
                { label: 'Decision Made', value: 'decisionMade', schema: { type: 'string' } },
                { label: 'Actor', value: 'actor', schema: { type: 'string' } },
                { label: 'Created', value: 'created', schema: { type: 'string' } },
                { label: 'Current Index', value: 'index', schema: { type: 'integer' } },
                { label: 'Total Count', value: 'count', schema: { type: 'integer' } }
            ], 'out');
        } else if (outputType === 'array') {
            return context.sendJson([
                { label: 'Total Count', value: 'count', schema: { type: 'integer' } },
                { label: 'Tasks', value: 'result', schema: { type: 'array', items: { type: 'object', properties: {
                    taskId: { type: 'string', title: 'Task ID' },
                    title: { type: 'string', title: 'Title' },
                    description: { type: 'string', title: 'Description' },
                    status: { type: 'string', title: 'Status' },
                    requester: { type: 'string', title: 'Requester' },
                    approver: { type: 'string', title: 'Approver' },
                    channel: { type: 'string', title: 'Channel' },
                    decisionBy: { type: 'string', title: 'Decision By' },
                    decisionByReadable: { type: 'string', title: 'Decision By (Human Readable)' },
                    decisionMade: { type: 'string', title: 'Decision Made' },
                    actor: { type: 'string', title: 'Actor' },
                    created: { type: 'string', title: 'Created' }
                } } } }
            ], 'out');
        } else { // file
            return context.sendJson([
                { label: 'File ID', value: 'fileId' },
                { label: 'Total Count', value: 'count', schema: { type: 'integer' } }
            ], 'out');
        }
    }
};
