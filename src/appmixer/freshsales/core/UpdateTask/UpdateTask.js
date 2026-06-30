'use strict';

module.exports = {
    async receive(context) {

        const {
            id, title, description,
            due_date: dueDate,
            task_type: taskType,
            priority, status,
            owner_id: ownerId
        } = context.messages.in.content;

        if (!id) throw new context.CancelError('Task ID is required!');

        const task = {};
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (dueDate !== undefined) task.due_date = dueDate;
        if (taskType !== undefined) task.task_type = taskType;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;
        if (ownerId !== undefined) task.owner_id = parseInt(ownerId);

        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://${context.auth.domain}/api/tasks/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: { task }
        });

        return context.sendJson(data.task, 'out');
    }
};
