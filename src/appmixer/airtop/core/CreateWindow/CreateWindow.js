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

        // The default landing URL lives in the `url` input's `defaultValue`
        // (component.json) and is not repeated here — a user who deliberately clears the
        // field gets Airtop's own blank window instead of being sent back to Google.
        const payload = {};

        if (url) {
            payload.url = url;
        }

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
