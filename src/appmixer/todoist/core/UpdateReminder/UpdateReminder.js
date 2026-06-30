'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { reminderId, type, dueString, dueDatetime, minuteOffset } = context.messages.in.content;

        if (!reminderId) {
            throw new context.CancelError('Reminder ID is required.');
        }

        const uuid = require('uuid').v4();

        const args = {
            id: reminderId
        };

        if (type) {
            args.type = type;
        }

        // Handle absolute reminders with due date
        if (type === 'absolute' || (!type && (dueString || dueDatetime))) {
            args.due = {};
            if (dueString) {
                args.due.string = dueString;
            } else if (dueDatetime) {
                args.due.date = dueDatetime;
            }
        }

        // Handle relative reminders with minute offset
        if (type === 'relative' || (!type && minuteOffset !== undefined)) {
            if (minuteOffset !== undefined) {
                args.minute_offset = minuteOffset;
            }
        }

        const response = await lib.syncApiRequest(context, [
            {
                type: 'reminder_update',
                uuid,
                args
            }
        ]);

        // Check for sync errors
        const syncStatus = response.sync_status?.[uuid];
        if (syncStatus && syncStatus.error) {
            throw new context.CancelError(syncStatus.error);
        }

        return context.sendJson({}, 'out');
    }
};
