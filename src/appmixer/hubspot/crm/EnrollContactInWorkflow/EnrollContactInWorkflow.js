'use strict';
const Hubspot = require('../../Hubspot');

module.exports = {
    async receive(context) {

        const {
            workflowId,
            email
        } = context.messages.in.content;

        const { auth } = context;
        const hs = new Hubspot(auth.accessToken, context.config);

        context.log({ stage: 'CRM - EnrollContactInWorkflow', workflowId, email });

        // https://developers.hubspot.com/docs/reference/api/automation/workflows/v2
        await hs.call(
            'post',
            `automation/v2/workflows/${encodeURIComponent(workflowId)}/enrollments/contacts/${encodeURIComponent(email)}`,
            {}
        );

        return context.sendJson({ workflowId, email }, 'out');
    }
};
