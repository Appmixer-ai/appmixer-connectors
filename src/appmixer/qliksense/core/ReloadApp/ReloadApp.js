'use strict';

const lib = require('../../lib');

// Default and maximum wait for a reload, in minutes.
const DEFAULT_TIMEOUT_MINUTES = 60;
const MAX_TIMEOUT_MINUTES = 24 * 60;

/**
 * Reload an app and deliver the reload once it reaches a final status.
 *
 * The Reloads API has no callback parameter, so the component submits the reload and then polls
 * GET /api/v1/reloads/{id} through a continuation chain (context.setTimeout), freeing the worker
 * in between. The continuation keeps the message scope, so the result continues the branch that
 * started the reload.
 */
module.exports = {

    async receive(context) {

        if (context.messages.timeout) {
            const { reloadId, appId, deadline, timeoutMinutes } = context.messages.timeout.content;
            const { data } = await lib.apiRequest(context, { path: '/api/v1/reloads/' + encodeURIComponent(reloadId) });

            if (lib.RELOAD_FINAL_STATUSES.includes(data.status)) {
                return context.sendJson(lib.mapReload(data), 'out');
            }
            if (Date.now() >= deadline) {
                throw new context.CancelError('The reload ' + reloadId + ' of app ' + appId + ' did not finish within '
                    + timeoutMinutes + ' minutes (status ' + data.status + '). It keeps running in Qlik Cloud; use Get Reload to check it later.');
            }
            return context.setTimeout({ reloadId, appId, deadline, timeoutMinutes }, lib.POLL_INTERVAL_MS);
        }

        const { appId, partial, variables, timeoutMinutes } = context.messages.in.content;
        if (!appId) {
            throw new context.CancelError('App is required!');
        }

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
            return context.sendJson(lib.mapReload(data), 'out');
        }

        const minutes = Number(timeoutMinutes) > 0
            ? Math.min(Number(timeoutMinutes), MAX_TIMEOUT_MINUTES)
            : DEFAULT_TIMEOUT_MINUTES;
        return context.setTimeout({
            reloadId: data.id,
            appId,
            deadline: lib.deadlineFrom(minutes, DEFAULT_TIMEOUT_MINUTES, MAX_TIMEOUT_MINUTES),
            timeoutMinutes: minutes
        }, lib.POLL_INTERVAL_MS);
    }
};
