'use strict';

const lib = require('../../lib');

// Airtop answers POST /sessions immediately with status "initializing". The
// session cannot be used until it reaches "running" — CreateWindow and every
// page operation answer 404 before then. Emitting the unready session would make
// any realistic flow (create session -> open window) fail on a race, so the
// component waits for readiness before sending its message.
const READY_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 2000;

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

        let session = lib.unwrap(context, data);

        if (session.status !== 'running') {
            session = await waitUntilRunning(context, session);
        }

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

/**
 * Poll the session until it reports "running".
 * @param {object} context
 * @param {object} created session as returned by POST /sessions
 * @returns {Promise<object>} the ready session
 */
async function waitUntilRunning(context, created) {

    const deadline = Date.now() + READY_TIMEOUT_MS;
    let session = created;

    while (Date.now() < deadline) {
        if (session.status === 'running') {
            return session;
        }
        if (session.status === 'ended') {
            throw new context.CancelError(
                `Airtop session ${created.id} ended before it became ready.`
            );
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

        const { data } = await lib.apiRequest(context, {
            method: 'GET',
            path: `/sessions/${encodeURIComponent(created.id)}`
        });
        session = lib.unwrap(context, data);
        // The status endpoint omits id on some responses; keep the known one.
        session.id = session.id || created.id;
    }

    throw new context.CancelError(
        `Airtop session ${created.id} did not become ready within ${READY_TIMEOUT_MS / 1000} seconds.`
    );
}
