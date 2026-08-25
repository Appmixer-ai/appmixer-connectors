'use strict';

const lib = require('../../lib');

module.exports = {

    async receive(context) {

        const {
            profileName,
            timeoutMinutes,
            solveCaptcha,
            useProxy,
            record,
            extensionIds
        } = context.messages.in.content;

        const configuration = {};

        if (profileName) {
            configuration.profileName = profileName;
        }
        if (timeoutMinutes) {
            configuration.timeoutMinutes = parseInt(timeoutMinutes, 10);
        }
        if (solveCaptcha) {
            configuration.solveCaptcha = true;
        }
        if (useProxy) {
            configuration.proxy = true;
        }
        if (record) {
            configuration.record = true;
        }
        if (extensionIds) {
            const ids = String(extensionIds).split(',').map(id => id.trim()).filter(id => id.length);
            if (ids.length) {
                configuration.extensionIds = ids;
            }
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: '/sessions',
            data: { configuration }
        });

        const session = lib.unwrap(context, data);

        return context.sendJson({
            id: session.id,
            status: session.status,
            dateCreated: session.dateCreated,
            lastActivity: session.lastActivity,
            currentUsage: session.currentUsage,
            cdpUrl: session.cdpUrl,
            cdpWsUrl: session.cdpWsUrl,
            chromedriverUrl: session.chromedriverUrl
        }, 'out');
    }
};
