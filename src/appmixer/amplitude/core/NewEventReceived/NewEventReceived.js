'use strict';

const lib = require('../../lib');

module.exports = {
    async tick(context) {
        const { project_id: projectId } = context.properties;

        if (!projectId) {
            throw new context.CancelError('Project ID is required!');
        }

        const state = context.getState() || {};
        const now = new Date();
        const start = state.lastPoll || new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago as default

        // Format dates for Amplitude API (YYYYMMDDTHH)
        const startFormatted = formatDateForAmplitude(start);
        const endFormatted = formatDateForAmplitude(now);

        // https://developers.amplitude.com/docs/export-api
        const { data } = await context.httpRequest({
            method: 'GET',
            url: 'https://analytics.eu.amplitude.com/api/3/events',
            params: {
                start: startFormatted,
                end: endFormatted
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from(context.auth.apiKey + ':' + context.auth.secretKey).toString('base64')}`
            }
        });

        // De-duplicate events using insert_id to avoid duplicate triggers
        const seenInsertIds = state.seenInsertIds || {};
        const events = data.events || [];

        for (const event of events) {
            if (event.insert_id && !seenInsertIds[event.insert_id]) {
                seenInsertIds[event.insert_id] = true;
                await context.sendJson(event, 'out');
            }
        }

        // Update state for next poll
        context.setState({
            lastPoll: now,
            seenInsertIds: seenInsertIds
        });
    }
};

function formatDateForAmplitude(date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    return `${year}${month}${day}T${hour}`;
}
