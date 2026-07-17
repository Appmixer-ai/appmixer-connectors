'use strict';

const { fhirRequest, normalizeAppointment } = require('../../commons');

module.exports = {

    async receive(context) {

        const { appointmentId } = context.messages.in.content;

        if (!appointmentId) {
            throw new context.CancelError('Appointment ID is required!');
        }

        const resource = await fhirRequest(context, { resource: `Appointment/${appointmentId}` });

        return context.sendJson(normalizeAppointment(resource), 'out');
    }
};
