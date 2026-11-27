'use strict';

const lib = require('../../lib');

// Default and maximum wait for a run, in minutes.
const DEFAULT_TIMEOUT_MINUTES = 60;
const MAX_TIMEOUT_MINUTES = 24 * 60;

const runPath = (automationId, runId) => '/api/workflows/automations/' + encodeURIComponent(automationId)
    + '/runs' + (runId ? '/' + encodeURIComponent(runId) : '');

/**
 * Run an automation and deliver the run once it reaches a final status.
 * The Automations API offers no callback, so the run is polled through a continuation chain
 * (context.setTimeout) that keeps the message scope.
 */
module.exports = {

    async receive(context) {

        if (context.messages.timeout) {
            const { automationId, runId, deadline, timeoutMinutes } = context.messages.timeout.content;
            const { data } = await lib.apiRequest(context, { path: runPath(automationId, runId) });

            if (lib.RUN_FINAL_STATUSES.includes(data.status)) {
                return context.sendJson(lib.mapAutomationRun(data, automationId), 'out');
            }
            if (Date.now() >= deadline) {
                throw new context.CancelError('The run ' + runId + ' of automation ' + automationId + ' did not finish within '
                    + timeoutMinutes + ' minutes (status ' + data.status + ').');
            }
            return context.setTimeout({ automationId, runId, deadline, timeoutMinutes }, lib.POLL_INTERVAL_MS);
        }

        const { automationId, timeoutMinutes } = context.messages.in.content;
        if (!automationId) {
            throw new context.CancelError('Automation is required!');
        }

        const { data } = await lib.apiRequest(context, {
            method: 'POST',
            path: runPath(automationId),
            data: { context: 'api' }
        });
        if (!data || !data.id) {
            throw new context.CancelError('Qlik Cloud started the automation but returned no run ID.');
        }
        if (lib.RUN_FINAL_STATUSES.includes(data.status)) {
            return context.sendJson(lib.mapAutomationRun(data, automationId), 'out');
        }

        const minutes = Number(timeoutMinutes) > 0
            ? Math.min(Number(timeoutMinutes), MAX_TIMEOUT_MINUTES)
            : DEFAULT_TIMEOUT_MINUTES;
        return context.setTimeout({
            automationId,
            runId: data.id,
            deadline: lib.deadlineFrom(minutes, DEFAULT_TIMEOUT_MINUTES, MAX_TIMEOUT_MINUTES),
            timeoutMinutes: minutes
        }, lib.POLL_INTERVAL_MS);
    }
};
