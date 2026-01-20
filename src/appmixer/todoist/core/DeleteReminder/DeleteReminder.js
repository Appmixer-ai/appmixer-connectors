'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { reminderId } = context.messages.in.content;

        if (!reminderId) {
            throw new context.CancelError('Reminder ID is required.');
        }

        const uuid = require('uuid').v4();

        const response = await lib.syncApiRequest(context, [
            {
                type: 'reminder_delete',
                uuid,
                args: { id: reminderId }
            }
        ]);

        // Check for errors in the sync_status
        if (response.sync_status && response.sync_status[uuid]) {
            const status = response.sync_status[uuid];
            if (status.error) {
                throw new Error(`Failed to delete reminder: ${status.error}`);
            }
        }

        return context.sendJson({}, 'out');
    }
};
