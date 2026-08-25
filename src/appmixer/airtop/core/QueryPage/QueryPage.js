'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            sessionId,
            windowId,
            prompt,
            outputSchema,
            followPaginationLinks,
            costThresholdCredits,
            timeThresholdSeconds
        } = context.messages.in.content;

        if (!sessionId) {
            throw new context.CancelError('Session ID is required!');
        }
        if (!windowId) {
            throw new context.CancelError('Window ID is required!');
        }
        if (!prompt) {
            throw new context.CancelError('Prompt is required!');
        }

        const payload = { prompt };

        if (followPaginationLinks) {
            payload.followPaginationLinks = true;
        }
        if (costThresholdCredits !== undefined && costThresholdCredits !== null && costThresholdCredits !== '') {
            payload.costThresholdCredits = parseInt(costThresholdCredits, 10);
        }
        if (timeThresholdSeconds !== undefined && timeThresholdSeconds !== null && timeThresholdSeconds !== '') {
            payload.timeThresholdSeconds = parseInt(timeThresholdSeconds, 10);
        }
        if (outputSchema) {
            // The API expects the JSON schema as a string. Validate it first so a typo
            // fails here with a clear message instead of inside Airtop.
            const parsed = lib.parseJsonInput(context, outputSchema, 'Output JSON Schema');
            payload.configuration = { outputSchema: JSON.stringify(parsed) };
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/sessions/${encodeURIComponent(sessionId)}/windows/${encodeURIComponent(windowId)}/page-query`,
            data: payload
        });

        const result = lib.aiResult(context, data);

        return context.sendJson({
            modelResponse: result.modelResponse,
            status: result.status,
            requestId: result.requestId,
            credits: result.credits
        }, 'out');
    }
};
