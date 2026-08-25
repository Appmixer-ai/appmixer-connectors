'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            sessionId,
            windowId,
            format,
            maxWidth,
            maxHeight,
            costThresholdCredits,
            timeThresholdSeconds
        } = context.messages.in.content;

        if (!sessionId) {
            throw new context.CancelError('Session ID is required!');
        }
        if (!windowId) {
            throw new context.CancelError('Window ID is required!');
        }

        const screenshot = {};

        if (format) {
            screenshot.format = format;
        }
        if (maxWidth) {
            screenshot.maxWidth = parseInt(maxWidth, 10);
        }
        if (maxHeight) {
            screenshot.maxHeight = parseInt(maxHeight, 10);
        }

        const payload = {};

        if (Object.keys(screenshot).length) {
            payload.configuration = { screenshot };
        }
        if (costThresholdCredits !== undefined && costThresholdCredits !== null && costThresholdCredits !== '') {
            payload.costThresholdCredits = parseInt(costThresholdCredits, 10);
        }
        if (timeThresholdSeconds !== undefined && timeThresholdSeconds !== null && timeThresholdSeconds !== '') {
            payload.timeThresholdSeconds = parseInt(timeThresholdSeconds, 10);
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/sessions/${encodeURIComponent(sessionId)}/windows/${encodeURIComponent(windowId)}/screenshot`,
            data: payload
        });

        const result = lib.aiResult(context, data);

        // The image itself is delivered in the response metadata, not in the data envelope.
        const image = result.screenshots[0] || {};

        return context.sendJson({
            dataUrl: image.dataUrl,
            signedDownloadUrl: image.signedDownloadUrl,
            fileName: image.fileName,
            format: image.format,
            status: result.status,
            requestId: result.requestId
        }, 'out');
    }
};
