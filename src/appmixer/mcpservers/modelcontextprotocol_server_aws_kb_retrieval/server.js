'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the deprecated
// @modelcontextprotocol/server-aws-kb-retrieval package (pinned to MCP SDK 0.5.0 / zod 3)
// and keeps its tool contract: same tool name, input schema and response text.
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { BedrockAgentRuntimeClient, RetrieveCommand } = require('@aws-sdk/client-bedrock-agent-runtime');

const bedrockClient = new BedrockAgentRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const RETRIEVAL_TOOL = {
    name: 'retrieve_from_aws_kb',
    description: 'Performs retrieval from the AWS Knowledge Base using the provided query and Knowledge Base ID.',
    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'The query to perform retrieval on' },
            knowledgeBaseId: { type: 'string', description: 'The ID of the AWS Knowledge Base' },
            n: { type: 'number', default: 3, description: 'Number of results to retrieve' }
        },
        required: ['query', 'knowledgeBaseId']
    }
};

async function retrieveContext(query, knowledgeBaseId, n = 3) {

    if (!knowledgeBaseId) {
        console.error('knowledgeBaseId is not provided');
        return { context: '', isRagWorking: false, ragSources: [] };
    }
    try {
        const response = await bedrockClient.send(new RetrieveCommand({
            knowledgeBaseId,
            retrievalQuery: { text: query },
            retrievalConfiguration: { vectorSearchConfiguration: { numberOfResults: n } }
        }));
        const rawResults = response?.retrievalResults || [];
        const ragSources = rawResults
            .filter(result => result?.content?.text)
            .map((result, index) => {
                const uri = result?.location?.s3Location?.uri || '';
                const fileName = uri.split('/').pop() || `Source-${index}.txt`;
                return {
                    id: result.metadata?.['x-amz-bedrock-kb-chunk-id'] || `chunk-${index}`,
                    fileName: fileName.replace(/_/g, ' ').replace('.txt', ''),
                    snippet: result.content?.text || '',
                    score: result.score || 0
                };
            })
            .slice(0, 3);
        const context = rawResults
            .filter(result => result?.content?.text !== undefined)
            .map(result => result.content.text)
            .join('\n\n');
        return { context, isRagWorking: true, ragSources };
    } catch (error) {
        // stdout is the MCP channel; diagnostics go to stderr.
        console.error('RAG Error:', error);
        return { context: '', isRagWorking: false, ragSources: [] };
    }
}

const server = new Server(
    { name: 'aws-kb-retrieval-server', version: '0.2.0' },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [RETRIEVAL_TOOL] }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    const { name, arguments: args = {} } = request.params;
    if (name !== RETRIEVAL_TOOL.name) {
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
    const { query, knowledgeBaseId, n = 3 } = args;
    const result = await retrieveContext(query, knowledgeBaseId, n);
    if (!result.isRagWorking) {
        return { content: [{ type: 'text', text: 'Retrieval failed or returned no results.' }] };
    }
    return {
        content: [
            { type: 'text', text: `Context: ${result.context}` },
            { type: 'text', text: `RAG Sources: ${JSON.stringify(result.ragSources)}` }
        ]
    };
});

server.connect(new StdioServerTransport())
    .then(() => console.error('AWS KB Retrieval Server running on stdio'))
    .catch((error) => {
        console.error('Fatal error running server:', error);
        process.exit(1);
    });
