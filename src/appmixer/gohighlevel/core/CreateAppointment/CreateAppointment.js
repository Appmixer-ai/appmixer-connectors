'use strict';

const BASE_URL = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

module.exports = {

    async receive(context) {

        const {
            calendarId,
            locationId,
            contactId,
            startTime,
            endTime,
            title,
            appointmentStatus,
            assignedUserId,
            address
        } = context.messages.in.content;

        const body = {
            calendarId,
            locationId,
            contactId,
            startTime,
            endTime
        };

        if (title) body.title = title;
        if (appointmentStatus) body.appointmentStatus = appointmentStatus;
        if (assignedUserId) body.assignedUserId = assignedUserId;
        if (address) body.address = address;

        const response = await context.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/calendars/events/appointments`,
            headers: {
                'Authorization': `Bearer ${context.auth.accessToken}`,
                'Content-Type': 'application/json',
                'Version': API_VERSION
            },
            data: body
        });

        return context.sendJson(response.data, 'out');
    }
};
