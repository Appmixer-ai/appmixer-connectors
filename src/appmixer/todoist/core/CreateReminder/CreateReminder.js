'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { taskId, type, dueString, dueDatetime, minuteOffset } = context.messages.in.content;

        if (!taskId) {
            throw new context.CancelError('Task ID is required!');
        }

        if (!type) {
            throw new context.CancelError('Type is required!');
        }

        if (type === 'absolute') {
            if (!dueString && !dueDatetime) {
                throw new context.CancelError('For absolute reminders, either Due String or Due Datetime must be provided!');
            }
        } else if (type === 'relative') {
            if (minuteOffset === undefined || minuteOffset === null) {
                throw new context.CancelError('For relative reminders, Minute Offset is required!');
            }
            // Validate that task has a due date for relative reminders
            const task = await lib.apiRequest(context, `/tasks/${taskId}`);
            if (!task.due) {
                throw new context.CancelError('For relative reminders, the task must have a due date set!');
            }
        } else {
            throw new context.CancelError('Type must be either "relative" or "absolute"!');
        }

        const uuid = require('uuid').v4();
        const tempId = 'temp_' + Date.now();

        const args = {
            item_id: taskId,
            type
        };

        if (type === 'absolute') {
            if (dueString) {
                args.due = { string: dueString };
            } else if (dueDatetime) {
                // Todoist API expects 'date' field for datetime values, not 'datetime'
                args.due = { date: dueDatetime };
            }
        } else if (type === 'relative') {
            args.minute_offset = minuteOffset;

        }

        const response = await lib.syncApiRequest(context, [
            {
                type: 'reminder_add',
                uuid,
                temp_id: tempId,
                args
            }
        ]);

        // Check for sync errors first
        const syncStatus = response.sync_status?.[uuid];
        if (syncStatus && syncStatus.error) {
            throw new context.CancelError(syncStatus.error);
        }

        // The Sync API returns the created reminder in the reminders array
        let reminder = response.reminders?.find(r => r.item_id === taskId);

        // If not found in reminders, try to get it from temp_id_mapping
        if (!reminder && response.temp_id_mapping?.[tempId]) {
            // Fetch all reminders to get the newly created one
            const allRemindersResponse = await context.httpRequest({
                method: 'POST',
                url: 'https://api.todoist.com/sync/v9/sync',
                headers: {
                    'Authorization': `Bearer ${context.auth.accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    sync_token: '*',
                    resource_types: ['reminders']
                }
            });

            const reminderId = response.temp_id_mapping[tempId];
            reminder = allRemindersResponse.data.reminders?.find(r => r.id === reminderId);
        }

        if (!reminder) {
            // Return minimal object with ID if reminder not found
            reminder = { id: response.temp_id_mapping?.[tempId] };
        }

        return context.sendJson(reminder, 'out');
    }
};
