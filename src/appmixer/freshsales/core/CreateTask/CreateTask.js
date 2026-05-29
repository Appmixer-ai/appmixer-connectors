'use strict';

module.exports = {
    async receive(context) {

        const {
            title,
            description,
            due_date: dueDate,
            task_type: taskType,
            priority,
            status,
            owner_id: ownerId,
            contact_id: contactId,
            account_id: accountId,
            deal_id: dealId,
            is_notification_set: isNotificationSet
        } = context.messages.in.content;

        if (!title) {
            throw new context.CancelError('Title is required!');
        }

        const task = {
            title,
            ...(description && { description }),
            ...(dueDate && { due_date: dueDate }),
            ...(taskType && { task_type: taskType }),
            ...(priority && { priority }),
            ...(status && { status }),
            ...(ownerId && { owner_id: parseInt(ownerId) }),
            ...(contactId && { contact_id: parseInt(contactId) }),
            ...(accountId && { account_id: parseInt(accountId) }),
            ...(dealId && { deal_id: parseInt(dealId) }),
            ...(typeof isNotificationSet !== 'undefined' && { is_notification_set: isNotificationSet })
        };

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://${context.auth.domain}/api/tasks`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: { task }
        });

        return context.sendJson(response.data.task, 'out');
    }
};
