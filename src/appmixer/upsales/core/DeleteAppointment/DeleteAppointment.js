'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const { appointmentId } = context.messages.in.content;

        if (!appointmentId) {
            throw new context.CancelError('Appointment ID is required!');
        }

        // https://api.upsales.com/ - Appointment: DELETE /appointments/{id}
        await lib.request(context, { method: 'DELETE', path: '/appointments/' + encodeURIComponent(appointmentId) });
        return context.sendJson({}, 'out');
    }
};
