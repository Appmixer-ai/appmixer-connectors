'use strict';

const BASE_URL = 'https://graph.microsoft.com/v1.0';

module.exports = {

    async tick(context) {

        const minutesBefore = context.properties.minutesBefore || 0;

        // Look ahead window: check events starting within the next 15 minutes (+ minutesBefore offset).
        const now = new Date();
        const startDateTime = new Date(now.getTime() - minutesBefore * 60 * 1000);
        const endDateTime = new Date(now.getTime() + 15 * 60 * 1000);

        const { data } = await context.httpRequest({
            url: `${BASE_URL}/me/calendarView`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${context.auth?.accessToken || context.accessToken}`,
                accept: 'application/json',
                Prefer: 'outlook.timezone="UTC"'
            },
            params: {
                startDateTime: startDateTime.toISOString(),
                endDateTime: endDateTime.toISOString()
            }
        });

        const events = data.value || [];
        const firedEvents = context.state.firedEvents || {};

        // Clean up old entries (older than 24h) to prevent state bloat.
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        for (const key of Object.keys(firedEvents)) {
            if (firedEvents[key] < cutoff) {
                delete firedEvents[key];
            }
        }

        for (const event of events) {
            if (!firedEvents[event.id]) {
                const eventStart = new Date(event.start.dateTime + 'Z');
                const triggerTime = new Date(eventStart.getTime() - minutesBefore * 60 * 1000);

                if (now >= triggerTime) {
                    firedEvents[event.id] = Date.now();
                    await context.sendJson(event, 'out');
                }
            }
        }

        await context.saveState({ firedEvents });
    }
};
