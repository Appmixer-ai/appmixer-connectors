'use strict';

const lib = require('../lib');

module.exports = {
    receive: async function(context) {
        if (context.properties.generateInspector) {
            const inspector = await this.generateInspectorForToolInputSchema(context);
            return context.sendJson(inspector, 'out');
        }

        const result = await lib.mcpCall(
            context,
            context.auth,
            'callTool',
            [{
                name: context.properties.tool,
                arguments: context.messages.in.content
            }]
        );
        const output = typeof result?.content[0].text === 'string'
            ? result?.content[0].text
            : JSON.stringify(result?.content[0].text, null, 2);
        // A tool that failed answers isError with the reason as its text (e.g. Teamwork's 403 "MCP is
        // disabled in the AI settings"); sending it on `out` would pass it off as a result
        if (result?.isError) {
            throw new context.CancelError(`Tool ${context.properties.tool} failed: ${output}`);
        }

        return await context.sendJson({ output }, 'out');
    },

    generateInspectorForToolInputSchema: async function(context) {
        const result = await lib.mcpCall(context, context.auth, 'listTools', []);
        const tools = result.tools || [];

        const inputs = {};
        tools.forEach(tool => {
            if (tool.name === context.properties.tool && tool.inputSchema && tool.inputSchema.properties) {
                let index = 1;
                Object.keys(tool.inputSchema.properties).forEach(property => {
                    const propertySchema = tool.inputSchema.properties[property];
                    const inspectorType = ({
                        'string': 'text',
                        'number': 'number',
                        'boolean': 'toggle',
                        'array': 'text',
                        'object': 'text'
                    })[propertySchema.type] || 'text';

                    inputs[property] = {
                        type: inspectorType,
                        label: property,
                        tooltip: propertySchema.description,
                        defaultValue: propertySchema.default,
                        index: index++
                    };
                });
            }
        });
        return { inputs };
    }
};
