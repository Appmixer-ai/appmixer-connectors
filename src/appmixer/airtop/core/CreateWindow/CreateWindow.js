'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            sessionId,
            url,
            waitUntil,
            waitUntilTimeoutSeconds,
            screenResolution
        } = context.messages.in.content;

        if (!sessionId) {
            throw new context.CancelError('Session ID is required!');
        }

        const payload = {
            url: url || 'https://www.google.com'
        };

        if (waitUntil) {
            payload.waitUntil = waitUntil;
        }
        if (waitUntilTimeoutSeconds) {
            payload.waitUntilTimeoutSeconds = parseInt(waitUntilTimeoutSeconds, 10);
        }
        if (screenResolution) {
            payload.screenResolution = screenResolution;
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: `/sessions/${encodeURIComponent(sessionId)}/windows`,
            data: payload
        });

        const window = lib.unwrap(context, data);

        return context.sendJson({
            windowId: window.windowId,
            targetId: window.targetId,
            title: window.title,
            url: window.url,
            sessionId
        }, 'out');
    }
};
