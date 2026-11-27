'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            activityId,
            description,
            date,
            closeDate,
            priority,
            userId,
            notes,
            customFields
        } = context.messages.in.content;

        if (!activityId) {
            throw new context.CancelError('Task ID is required!');
        }

        const body = lib.compact({
            description,
            notes,
            date: lib.toDate(context, date, 'Due Date'),
            closeDate: lib.toDate(context, closeDate, 'Completed On'),
            priority: priority === undefined || priority === '' ? undefined : Number(priority),
            users: userId ? [lib.ref(userId)] : undefined,
            custom: lib.parseCustomFields(context, customFields)
        });

        // https://api.upsales.com/ - Tasks: PUT /activities/{id} (closeDate marks it as done)
        await lib.request(context, { method: 'PUT', path: '/activities/' + encodeURIComponent(activityId), data: body });
        return context.sendJson({}, 'out');
    }
};
