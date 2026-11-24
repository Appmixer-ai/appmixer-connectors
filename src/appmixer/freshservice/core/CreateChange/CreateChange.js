'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const content = context.messages.in.content;
        const required = [
            ['subject', 'Subject'],
            ['description', 'Description'],
            ['status', 'Status'],
            ['priority', 'Priority'],
            ['impact', 'Impact'],
            ['risk', 'Risk'],
            ['changeType', 'Change Type']
        ];
        for (const [key, label] of required) {
            const value = content[key];
            if (value === undefined || value === null || value === '') {
                throw new context.CancelError(`${label} is required!`);
            }
        }
        if (!content.email && !content.requesterId) {
            throw new context.CancelError('Requester Email or Requester ID is required!');
        }

        const requester = content.requesterId
            ? { requester_id: Number(lib.requireId(context, content.requesterId, 'Requester ID')) }
            : { email: content.email };

        const body = lib.compact({
            subject: content.subject,
            description: content.description,
            ...requester,
            status: lib.optionalNumber(context, content.status, 'Status'),
            priority: lib.optionalNumber(context, content.priority, 'Priority'),
            impact: lib.optionalNumber(context, content.impact, 'Impact'),
            risk: lib.optionalNumber(context, content.risk, 'Risk'),
            change_type: lib.optionalNumber(context, content.changeType, 'Change Type'),
            planned_start_date: lib.toIsoDate(context, content.plannedStartDate, 'Planned Start Date'),
            planned_end_date: lib.toIsoDate(context, content.plannedEndDate, 'Planned End Date'),
            agent_id: lib.optionalId(context, content.agentId, 'Agent ID'),
            group_id: lib.optionalId(context, content.groupId, 'Group ID'),
            department_id: lib.optionalId(context, content.departmentId, 'Department ID'),
            category: content.category,
            sub_category: content.subCategory,
            item_category: content.itemCategory,
            workspace_id: lib.optionalId(context, content.workspaceId, 'Workspace ID'),
            custom_fields: lib.parseCustomFields(context, content.customFields)
        });

        const { data } = await lib.request(context, { method: 'POST', path: '/changes', data: body });

        return context.sendJson(lib.withoutNulls(data.change), 'out');
    }
};
