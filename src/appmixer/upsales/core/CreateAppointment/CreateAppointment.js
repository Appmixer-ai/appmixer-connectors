'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            appointmentTypeId,
            description,
            userId,
            date,
            endDate,
            companyId,
            contactId,
            location,
            notes
        } = context.messages.in.content;

        if (!appointmentTypeId) {
            throw new context.CancelError('Appointment Type is required!');
        }
        if (!description) {
            throw new context.CancelError('Description is required!');
        }
        if (!userId) {
            throw new context.CancelError('User is required!');
        }
        if (!date) {
            throw new context.CancelError('Start is required!');
        }

        const body = lib.compact({
            description,
            location,
            notes,
            date: lib.toDateTime(context, date, 'Start'),
            endDate: lib.toDateTime(context, endDate, 'End'),
            client: lib.ref(companyId),
            contacts: contactId ? [lib.ref(contactId)] : undefined,
            users: [lib.ref(userId)],
            activityType: lib.ref(appointmentTypeId),
            isAppointment: true
        });

        // https://api.upsales.com/ - Appointment: POST /appointments
        const { data } = await lib.request(context, { method: 'POST', path: '/appointments', data: body });
        return context.sendJson(data.data, 'out');
    }
};
