'use strict';
const moment = require('moment');
const ActiveCampaign = require('../../ActiveCampaign');

module.exports = {

    async receive(context) {

        const { auth } = context;

        const {
            relationship,
            contactId,
            dealId,
            title,
            note,
            taskType,
            assignee,
            due,
            duration,
            durationUnits
        } = context.messages.in.content;
        if (!relationship) {
            throw new context.CancelError('Task Relationship is required');
        }

        if (!taskType) {
            throw new context.CancelError('Task type is required');
        }

        if (!title) {
            throw new context.CancelError('Title is required');
        }

        if (!note) {
            throw new context.CancelError('Description is required');
        }

        if (!due) {
            throw new context.CancelError('Due is required');
        }

        if (!duration) {
            throw new context.CancelError('Duration is required');
        }

        if (!durationUnits) {
            throw new context.CancelError('Duration units is required');
        }


        const dueDate = moment(due);
        const eDate = dueDate.add(duration, durationUnits);

        const ac = new ActiveCampaign(auth.url, auth.apiKey, context);

        const body = {
            title,
            ownerType: relationship,
            relid: relationship === 'contact' ? contactId : dealId,
            note,
            dealTasktype: taskType,
            duedate: due,
            assignee,
            edate: eDate.toISOString()
        };

        const { data } = await ac.call('post', 'dealTasks', {
            dealTask: body
        });

        const { dealTask } = data;

        const taskResponseModified = {
            ...dealTask,
            contactId: dealTask.owner.type === 'contact' ? dealTask.relid : undefined,
            dealId: dealTask.owner.type === 'deal' ? dealTask.relid : undefined,
            due: new Date(dealTask.duedate).toISOString(),
            edate: new Date(dealTask.edate).toISOString()
        };

        delete taskResponseModified.duedate;
        delete taskResponseModified.links;

        return context.sendJson(taskResponseModified, 'newTask');
    }
};
