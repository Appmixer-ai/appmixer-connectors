'use strict';

module.exports = {
    async receive(context) {
        const {
            id, title, from_date: fromDate, end_date: endDate,
            time_zone: timeZone, location, description
        } = context.messages.in.content;
        if (!id) throw new context.CancelError('Appointment ID is required!');

        const appointment = {};
        if (title) appointment.title = title;
        if (fromDate) appointment.from_date = fromDate;
        if (endDate) appointment.end_date = endDate;
        if (timeZone) appointment.time_zone = timeZone;
        if (location) appointment.location = location;
        if (description) appointment.description = description;

        const { data } = await context.httpRequest({
            method: 'PUT',
            url: `https://${context.auth.domain}/api/appointments/${id}`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: { appointment }
        });

        return context.sendJson(data.appointment, 'out');
    }
};
