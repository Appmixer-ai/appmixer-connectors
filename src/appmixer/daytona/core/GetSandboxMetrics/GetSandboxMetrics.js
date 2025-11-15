'use strict';

module.exports = {

    async receive(context) {

        const { sandboxId } = context.messages.in.content;

        if (!sandboxId) {
            throw new context.CancelError('Sandbox ID is required!');
        }

        const { data } = await context.httpRequest({
            method: 'GET',
            url: `https://app.daytona.io/api/sandbox/${sandboxId}/metrics`,
            headers: {
                'Authorization': `Bearer ${context.auth.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return context.sendJson({
            cpuUsage: data.cpu_usage || data.cpuUsage || 0,
            memoryUsage: data.memory_usage || data.memoryUsage || 0,
            diskUsage: data.disk_usage || data.diskUsage || 0,
            networkIn: data.network_in || data.networkIn || 0,
            networkOut: data.network_out || data.networkOut || 0,
            timestamp: data.timestamp || new Date().toISOString()
        }, 'out');
    }
};
