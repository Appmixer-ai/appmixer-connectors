'use strict';

const lib = require('../../lib');

// Default and maximum wait for a reload, in minutes.
const DEFAULT_TIMEOUT_MINUTES = 60;
const MAX_TIMEOUT_MINUTES = 24 * 60;
// How much of the end of the reload log goes into the error message.
const LOG_EXCERPT_CHARS = 1000;

/**
 * The error of a reload that ended in a final status other than SUCCEEDED: the reload ID,
 * status, Qlik's error code and message, and the end of the reload log.
 * @param {object} reload
 * @returns {string}
 */
const failureMessage = (reload) => {

    const parts = ['The reload ' + reload.id + ' of app ' + reload.appId + ' ended with status ' + reload.status + '.'];
    if (reload.errorCode) {
        parts.push('Error code: ' + reload.errorCode + '.');
    }
    if (reload.errorMessage) {
        parts.push('Error: ' + reload.errorMessage);
    }
    if (reload.log) {
        const log = String(reload.log).trim();
        parts.push('Reload log' + (log.length > LOG_EXCERPT_CHARS ? ' (end)' : '') + ':\n'
            + (log.length > LOG_EXCERPT_CHARS ? '…' + log.slice(-LOG_EXCERPT_CHARS) : log));
    }
    return parts.join(' ');
};

/**
 * Deliver a reload in a final status, or fail when it did not succeed and the option is on.
 * @param {object} context
 * @param {object} data the reload from the Reloads API
 * @param {boolean} failIfNotSucceeded
 */
const finish = async (context, data, failIfNotSucceeded) => {

    const reload = lib.mapReload(data);
    if (failIfNotSucceeded && reload.status !== 'SUCCEEDED') {
        throw new context.CancelError(failureMessage(reload));
    }
    return context.sendJson(reload, 'out');
};

/**
 * Reload an app and deliver the reload once it reaches a final status.
 *
 * The Reloads API has no callback parameter, so the component submits the reload and then polls
 * GET /api/v1/reloads/{id} through a continuation chain (context.setTimeout), freeing the worker
 * in between. The continuation keeps the message scope, so the result continues the branch that
 * started the reload.
 */
module.exports = {

    failureMessage,

    async receive(context) {

        if (context.messages.timeout) {
            const { reloadId, appId, deadline, timeoutMinutes, failIfNotSucceeded } = context.messages.timeout.content;
            const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads/' + encodeURIComponent(reloadId) });

            if (lib.RELOAD_FINAL_STATUSES.includes(data.status)) {
                // Jobs scheduled before the option existed carry no flag: the default (on) applies.
                return finish(context, data, failIfNotSucceeded !== false);
            }
            if (Date.now() >= deadline) {
                throw new context.CancelError('The reload ' + reloadId + ' of app ' + appId + ' did not finish within '
                    + timeoutMinutes + ' minutes (status ' + data.status + '). It keeps running in Qlik Cloud; use Get Reload to check it later.');
            }
            const job = { reloadId, appId, deadline, timeoutMinutes, failIfNotSucceeded };
            return context.setTimeout(job, lib.POLL_INTERVAL_MS);
        }

        const { appId, partial, variables, timeoutMinutes } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }
        // On by default: a reload that does not succeed fails the component.
        const failIfNotSucceeded = context.messages.in.content.failIfNotSucceeded !== false;

        const body = { appId };
        if (partial) {
            body.partial = true;
        }
        const vars = lib.kvToObject(variables);
        if (Object.keys(vars).length) {
            body.variables = Object.fromEntries(Object.entries(vars).map(([key, value]) => [key, String(value)]));
        }

        const { data } = await lib.apiRequest(context, { method: 'POST', path: '/api/v1/reloads', data: body });
        if (!data || !data.id) {
            throw new context.CancelError('Qlik Cloud accepted the reload but returned no reload ID.');
        }
        if (lib.RELOAD_FINAL_STATUSES.includes(data.status)) {
            return finish(context, data, failIfNotSucceeded);
        }

        const minutes = Number(timeoutMinutes) > 0
            ? Math.min(Number(timeoutMinutes), MAX_TIMEOUT_MINUTES)
            : DEFAULT_TIMEOUT_MINUTES;
        return context.setTimeout({
            reloadId: data.id,
            appId,
            deadline: lib.deadlineFrom(minutes, DEFAULT_TIMEOUT_MINUTES, MAX_TIMEOUT_MINUTES),
            timeoutMinutes: minutes,
            failIfNotSucceeded
        }, lib.POLL_INTERVAL_MS);
    }
};
