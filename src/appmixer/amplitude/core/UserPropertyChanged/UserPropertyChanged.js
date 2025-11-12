'use strict';

module.exports = {
    async tick(context) {

        // Get the last poll time from state, or use current time - 1 hour
        const state = context.getState();
        const now = new Date();
        const lastPoll = state.lastPoll ? new Date(state.lastPoll) : new Date(now.getTime() - 3600000);

        // Format dates for Amplitude API (YYYYMMDDTHH)
        const startTime = formatAmplitudeTime(lastPoll);
        const endTime = formatAmplitudeTime(now);

        // https://developers.amplitude.com/docs/export-api
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://amplitude.com/api/2/export',
            headers: {
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            },
            params: {
                start: startTime,
                end: endTime
            }
        });

        // Update the last poll time
        await context.setState({ lastPoll: now.toISOString() });

        // Process the response data
        if (data && Array.isArray(data)) {
            for (const record of data) {
                if (record.event_type === '$identify') {
                    await context.sendJson(record, 'out');
                }
            }
        }
    }
};

function formatAmplitudeTime(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${year}${month}${day}T${hour}`;
}
