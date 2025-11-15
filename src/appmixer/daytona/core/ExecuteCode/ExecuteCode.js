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

        const { data } = await context.httpRequest({
            method: 'POST',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/exec`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            },
            data: requestBody
        });

        return context.sendJson({
            result: data && (data.result || data.stdout) || '',
            exitCode: data && (data.exit_code || data.exitCode) || 0,
            stdout: data && data.stdout || '',
            stderr: data && data.stderr || '',
            executionTime: data && (data.execution_time || data.executionTime) || null
        }, 'out');
    }
};
