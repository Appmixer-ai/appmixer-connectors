'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appointmentId, description, date, endDate, location, notes, userId } = context.messages.in.content;

        if (!appointmentId) {
            throw new context.CancelError('Appointment ID is required!');
        }

        const body = lib.compact({
            description,
            location,
            notes,
            date: lib.toDateTime(context, date, 'Start'),
            endDate: lib.toDateTime(context, endDate, 'End'),
            users: userId ? [lib.ref(userId)] : undefined
        });

        // https://api.upsales.com/ - Appointment: PUT /appointments/{id}
        await lib.request(context, { method: 'PUT', path: '/appointments/' + encodeURIComponent(appointmentId), data: body });
        return context.sendJson({}, 'out');
    }
};
