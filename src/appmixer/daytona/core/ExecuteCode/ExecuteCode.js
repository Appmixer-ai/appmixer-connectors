'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId, code, timeout } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        if (!code) {
            throw new context.CancelError('Code is required!');
        }

        const requestBody = {
            code: code
        };

        if (timeout) {
            requestBody.timeout = timeout;
        }

        const response = await context.httpRequest({
            method: 'POST',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/exec`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({
            result: data.result || data.stdout || '',
            exitCode: data.exit_code || data.exitCode || 0,
            stdout: data.stdout || '',
            stderr: data.stderr || '',
            executionTime: data.execution_time || data.executionTime
        }, 'out');
    }
};
