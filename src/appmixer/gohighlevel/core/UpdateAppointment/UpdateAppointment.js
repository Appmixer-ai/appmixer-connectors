'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

const FIELDS = ['title', 'appointmentStatus', 'startTime', 'endTime', 'assignedUserId', 'address'];

module.exports = {

    async receive(context) {

        const { appointmentId, ...input } = context.messages.in.content;

        if (!appointmentId) {
            throw new context.CancelError('Appointment ID is required!');
        }

        const body = {};
        FIELDS.forEach(field => {
            if (input[field] !== undefined && input[field] !== null && input[field] !== '') {
                body[field] = input[field];
            }
        });

        if (!Object.keys(body).length) {
            throw new context.CancelError('Fill in at least one field to update.');
        }

        await context.httpRequest({
            method: 'PUT',
            url: `${BASE_URL}/calendars/events/appointments/${encodeURIComponent(appointmentId)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Version': API_VERSION
            },
            data: body
        });

        return context.sendJson({}, 'out');
    }
};
