'use strict';

const { createClient, parseToolResult } = require('../../mcp-commons');

/**
 * AI-powered MCP tool caller.
 *
 * This component uses an LLM to:
 * 1. Discover available tools from the MCP server
 * 2. Select the appropriate tool(s) based on a natural language prompt
 * 3. Generate tool arguments
 * 4. Execute tool calls
 * 5. Summarize results
 *
 * NOTE: This is a scaffold. The actual LLM integration depends on the AI infrastructure
 * available in the Appmixer instance. The implementation below uses a simple keyword-based
 * approach that should be adapted to the specific AI provider.
 */
module.exports = {

    async receive(context) {

        const { prompt, context: additionalContext } = context.messages.in.content;
        const maxSteps = context.properties.maxSteps || 3;

        const client = createClient(context);

        // Initialize MCP session
        await client.initialize(context.httpRequest.bind(context));

        // Get available tools
        const tools = await client.listAllTools(context.httpRequest.bind(context));

        const steps = [];
        const results = [];
        const toolsCalled = [];

        // Simple single-step execution: find matching tool and call it
        // For full AI agent loop, integrate with an LLM provider here
        const matchedTool = findBestToolMatch(prompt, tools);

        if (matchedTool) {
            try {
                const args = extractArgsFromPrompt(prompt, matchedTool);
                const result = await client.callTool(matchedTool.name, args, context.httpRequest.bind(context));
                const parsed = parseToolResult(result);

                toolsCalled.push(matchedTool.name);
                results.push(parsed);
                steps.push({
                    tool: matchedTool.name,
                    args,
                    result: parsed.text,
                    isError: parsed.isError
                });
            } catch (err) {
                steps.push({
                    tool: matchedTool.name,
                    error: err.message
                });
            }
        }

        // Generate answer summary
        const answer = results.length > 0
            ? results.map(r => r.text).join('\n\n')
            : `No matching tool found for: "${prompt}". Available tools: ${tools.map(t => t.name).join(', ')}`;

        return context.sendJson({
            answer,
            toolsCalled,
            results,
            steps
        }, 'out');
    }
};

/**
 * Simple keyword-based tool matching.
 * In a full implementation, this would be replaced by an LLM call.
 */
function findBestToolMatch(prompt, tools) {

    const promptLower = prompt.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const tool of tools) {
        let score = 0;
        const nameWords = tool.name.toLowerCase().split(/[_\-\s]+/);
        const descWords = (tool.description || '').toLowerCase().split(/\s+/);

        for (const word of nameWords) {
            if (word.length > 2 && promptLower.includes(word)) {
                score += 3;
            }
        }

        for (const word of descWords) {
            if (word.length > 3 && promptLower.includes(word)) {
                score += 1;
            }
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = tool;
        }
    }

    return bestScore > 0 ? bestMatch : null;
}

/**
 * Simple argument extraction from prompt.
 * In a full implementation, this would be replaced by an LLM call.
 */
function extractArgsFromPrompt(prompt, tool) {

    const schema = tool.inputSchema;
    if (!schema || !schema.properties) return {};

    const args = {};
    const props = schema.properties;

    const queryKeys = ['query', 'search', 'filter', 'q', 'name', 'text', 'term'];
    for (const key of queryKeys) {
        if (props[key]) {
            args[key] = prompt;
            break;
        }
    }

    return args;
}
