'use strict';

module.exports = {

    async receive(context) {

        const { datasetId, events } = context.messages.in.content;

        if (!datasetId) {
            throw new context.CancelError('Dataset ID is required!');
        }

        if (!events) {
            throw new context.CancelError('Events is required!');
        }

        let eventsArray;
        try {
            eventsArray = JSON.parse(events);
        } catch (error) {
            throw new context.CancelError('Events must be a valid JSON array!');
        }

        if (!Array.isArray(eventsArray)) {
            throw new context.CancelError('Events must be a JSON array!');
        }

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://api.axiom.co/v1/datasets/${datasetId}/ingest`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiToken}`,
                'Content-Type': 'application/json'
            },
            data: eventsArray
        });

        return context.sendJson(data, 'out');
    }
};
