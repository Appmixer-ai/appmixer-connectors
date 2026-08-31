'use strict';

const lib = require('../../lib');

// Airtop answers POST /sessions immediately with status "initializing". The
// session cannot be used until it reaches "running" — CreateWindow and every
// page operation answer 404 before then. Emitting the unready session would make
// any realistic flow (create session -> open window) fail on a race, so the
// component waits for readiness before sending its message.
const READY_TIMEOUT_MS = 120000;
const POLL_INTERVAL_MS = 2000;
// Statuses a session never leaves. Polling past any of them only burns API calls
// and then reports a misleading timeout.
const TERMINAL_STATUSES = ['ended', 'completed', 'cancelled'];

module.exports = {

    async receive(context) {

        const {
            profileName,
            timeoutMinutes,
            solveCaptcha,
            useProxy,
            record,
            extensionIds,
            waitUntilRunning = true
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

        if (waitUntilRunning && session.status !== 'running') {
            try {
                session = await pollUntilRunning(context, session);
            } catch (err) {
                // The session is already created and billing. Whatever went wrong while
                // waiting for readiness (timeout, HTTP failure, API error), nobody
                // downstream will ever hold its ID, so terminate it instead of leaving it
                // to run until its idle timeout — which the user may set to seven days.
                await terminateQuietly(context, session.id);
                throw err;
            }
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
async function pollUntilRunning(context, created) {

    const deadline = Date.now() + READY_TIMEOUT_MS;
    let session = created;

    // The freshly fetched status is always evaluated before the deadline, so a session
    // that turns "running" on the last poll is accepted rather than reported as a timeout.
    for (;;) {
        if (session.status === 'running') {
            return session;
        }
        if (TERMINAL_STATUSES.includes(session.status)) {
            throw new context.CancelError(
                `Airtop session ${created.id} reached the terminal status "${session.status}" before it became ready.`
            );
        }
        if (Date.now() >= deadline) {
            throw new context.CancelError(
                `Airtop session ${created.id} did not become ready within ${READY_TIMEOUT_MS / 1000} seconds `
                + `(last reported status: ${session.status || 'unknown'}).`
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
}

/**
 * Terminate a session on a best-effort basis. Used to clean up a session that was
 * created but never handed downstream — the readiness failure is the error worth
 * reporting, a failed cleanup must not mask it.
 * @param {object} context
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
async function terminateQuietly(context, sessionId) {

    if (!sessionId) {
        return;
    }

    try {
        await lib.apiRequest(context, {
            method: 'DELETE',
            path: `/sessions/${encodeURIComponent(sessionId)}`
        });
        await context.log({ step: 'Terminated the Airtop session that never became ready', sessionId });
    } catch (err) {
        await context.log({
            step: 'Failed to terminate the Airtop session that never became ready',
            sessionId,
            error: err.message
        });
    }
}
