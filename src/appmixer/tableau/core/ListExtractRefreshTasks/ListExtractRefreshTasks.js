'use strict';

const lib = require('../../lib');

const ITEM_SCHEMA = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string', title: 'Task ID', example: '9bf8aea0-e3ca-422e-b7ef-d9c4ba6cca45' },
        type: { type: 'string', title: 'Type', example: 'RefreshExtractTask' },
        priority: { type: 'integer', title: 'Priority', example: 50 },
        consecutiveFailedCount: { type: 'integer', title: 'Consecutive Failed Count', example: 0 },
        workbookId: { type: 'string', title: 'Workbook ID', example: '5a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d' },
        datasourceId: { type: 'string', title: 'Data Source ID', example: '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f' },
        scheduleId: { type: 'string', title: 'Schedule ID', example: 'c9d8e7f6-a5b4-4c3d-9e2f-1a0b9c8d7e6f' },
        scheduleFrequency: { type: 'string', title: 'Schedule Frequency', example: 'Daily' },
        nextRunAt: { type: 'string', format: 'date-time', title: 'Next Run At', example: '2026-11-18T02:00:00Z' }
    }
};

module.exports = {

    ITEM_SCHEMA,

    async receive(context) {

        const { outputType } = context.messages.in.content;

        if (context.properties.generateOutputPortOptions) {
            return lib.getOutputPortOptions(context, outputType, ITEM_SCHEMA.properties, { label: 'Tasks', value: 'result' });
        }

        const { data } = await lib.apiRequest(context, { path: '/tasks/extractRefreshes' });
        const records = lib.toList(data.tasks, 'task').map(lib.mapTask);

        return lib.sendArrayOutput({ context, outputType, records });
    }
};
