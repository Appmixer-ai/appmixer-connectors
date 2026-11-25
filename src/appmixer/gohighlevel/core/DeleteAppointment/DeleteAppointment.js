'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const { appointmentId } = context.messages.in.content;

        if (!appointmentId) {
            throw new context.CancelError('Appointment ID is required!');
        }

        await context.httpRequest({
            method: 'DELETE',
            url: `${BASE_URL}/calendars/events/${encodeURIComponent(appointmentId)}`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Version': API_VERSION
            }
        });

        return context.sendJson({}, 'out');
    }
};
