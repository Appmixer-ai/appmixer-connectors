'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {
    async receive(context) {

        const {
            associationTypeId,
            objectId,
            hsTaskSubject,
            hsTaskBody,
            hsTaskStatus = 'NOT_STARTED',
            hsTaskType = 'TODO',
            hsTimestamp
        } = context.messages.in.content;

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        const payload = {
            properties: {
                hs_timestamp: hsTimestamp || new Date().toISOString(),
                hs_task_subject: hsTaskSubject,
                hs_task_body: hsTaskBody || '',
                hs_task_status: hsTaskStatus,
                hs_task_type: hsTaskType
            },
            associations: [
                {
                    to: { id: objectId },
                    types: [
                        {
                            associationCategory: 'HUBSPOT_DEFINED',
                            // https://developers.hubspot.com/docs/api/crm/associations#association-type-id-values
                            associationTypeId
                        }
                    ]
                }
            ]
        };

        context.log({ stage: 'Engagements - CreateTask payload', payload });

        const { data } = await hs.call(
            'post',
            'crm/v3/objects/tasks',
            payload
        );

        return context.sendJson(data, 'out');
    }
};
