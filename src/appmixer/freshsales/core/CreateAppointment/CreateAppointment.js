'use strict';

module.exports = {

    async receive(context) {

        const {
            title,
            from_date: fromDate,
            end_date: endDate,
            time_zone: timeZone,
            targetable_type: targetableType,
            targetable_id: targetableId,
            location,
            description
        } = context.messages.in.content;

        // Build appointment object with required fields
        const appointment = {
            title,
            from_date: fromDate,
            end_date: endDate
        };

        // Add optional fields only if provided
        if (timeZone) appointment.time_zone = timeZone;
        if (location) appointment.location = location;
        if (description) appointment.description = description;
        if (targetableType) appointment.targetable_type = targetableType;
        if (targetableId) appointment.targetable_id = targetableId;

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://${context.auth.domain}/api/appointments`,
            headers: {
                'Authorization': `Token token=${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: { appointment }
        });

        return context.sendJson(data, 'out');
    }
};
