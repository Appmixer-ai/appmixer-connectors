'use strict';

const lib = require('../lib');

module.exports = {

    receive: async function(context) {

        const action = context.messages.webhook?.content?.query?.action;

        let { url, headers } = context.properties;

        if (action === 'listTools') {
            const result = await lib.mcpCall(context, url, headers, 'listTools', []);
            let tools = result.tools || [];

            return context.response(tools, 200, { 'Content-Type': 'application/json' });
        } else if (action === 'callTool') {
            // AI Agent requested to call a tool.
            let output;
            // Wrap the call in a try/catch block to handle errors since we don't want Appmixer to retry
            // the failed message.
            try {
                const result = await lib.mcpCall(
                    context,
                    url,
                    headers,
                    'callTool',
                    context.messages.webhook?.content?.data ? [{
                        name: context.messages.webhook.content.data.name,
                        arguments: context.messages.webhook.content.data.arguments
                    }] : []
                );
                const text = result?.content?.[0]?.text;
                output = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
                await context.response(output, 200, { 'Content-Type': 'text/plain' });
            } catch (err) {
                output = 'Error calling tool: ' + err.message;
                await context.response(output, err.response?.status || 500, { 'Content-Type': 'text/plain' });
            }
            // Useful so that other actions can take place in the flow to process the result of calling the tool.
            return context.sendJson({ output }, 'out');
        }
    }
};
