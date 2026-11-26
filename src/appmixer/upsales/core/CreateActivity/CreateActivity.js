'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            type,
            description,
            userId,
            companyId,
            contactId,
            date,
            priority,
            notes
        } = context.messages.in.content;

        if (!type) {
            throw new context.CancelError('Type is required!');
        }
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (!userId) {
            throw new context.CancelError('Assigned User is required!');
        }
        if (type === 'phoneCall' && !companyId) {
            throw new context.CancelError('Company ID is required for a phone call!');
        }

        const activityTypeId = await lib.taskTypeId(context, type);

        const body = lib.compact({
            description,
            notes,
            date: lib.toDate(context, date, 'Due Date'),
            client: lib.ref(companyId),
            contacts: contactId ? [lib.ref(contactId)] : undefined,
            users: [lib.ref(userId)],
            activityType: { id: activityTypeId },
            priority: priority === undefined || priority === '' ? undefined : Number(priority),
            isAppointment: 0
        });

        // https://api.upsales.com/ - Tasks: POST /activities
        const { data } = await lib.request(context, { method: 'POST', path: '/activities', data: body });
        return context.sendJson(data.data, 'out');
    }
};
