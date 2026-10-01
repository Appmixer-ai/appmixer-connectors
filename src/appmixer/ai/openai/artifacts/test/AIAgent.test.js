'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const AIAgent = require('../../AIAgent/AIAgent');

describe('AIAgent - mcpCallTool', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should pass correlationId from context.messages.in.correlationId to mcpCallTool', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: 'test-correlation-id-123'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        await AIAgent.mcpCallTool(context, 'mcp-component-id', 'testTool', { arg1: 'value1' });

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.correlationId, 'test-correlation-id-123', 'correlationId should be passed in request data');
    });

    it('should pass tool name and arguments to mcpCallTool', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: 'correlation-123'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        const toolName = 'myTool';
        const toolArgs = { param1: 'value1', param2: 'value2' };

        await AIAgent.mcpCallTool(context, 'mcp-component-id', toolName, toolArgs);

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.name, toolName, 'tool name should be passed correctly');
        assert.deepStrictEqual(callArgs.data.arguments, toolArgs, 'tool arguments should be passed correctly');
    });

    it('should handle missing correlationId gracefully', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {}
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        await AIAgent.mcpCallTool(context, 'mcp-component-id', 'testTool', { arg1: 'value1' });

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.correlationId, undefined, 'correlationId should be undefined when not provided');
    });

    it('should handle null correlationId gracefully', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: null
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        await AIAgent.mcpCallTool(context, 'mcp-component-id', 'testTool', { arg1: 'value1' });

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.correlationId, null, 'correlationId should be null when explicitly set to null');
    });

    it('should construct correct API URL for mcpCallTool', async () => {

        const context = createMockContext({
            flowId: 'flow-123',
            componentId: 'component-456',
            messages: {
                in: {
                    correlationId: 'corr-789'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        await AIAgent.mcpCallTool(context, 'mcp-component-id', 'testTool', {});

        const callArgs = context.httpRequest.firstCall.args[0];
        assert(callArgs.url.includes('flow-123'), 'URL should contain flow ID');
        assert(callArgs.url.includes('mcp-component-id'), 'URL should contain component ID');
        assert.strictEqual(callArgs.method, 'POST', 'method should be POST');
    });

    it('should return the response data from mcpCallTool', async () => {

        const expectedData = {
            toolResult: 'output from tool',
            status: 'success'
        };

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: 'test-correlation-id'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: expectedData
            })
        });

        const result = await AIAgent.mcpCallTool(context, 'mcp-component-id', 'testTool', {});

        assert.deepStrictEqual(result, expectedData, 'should return the response data');
    });
});

describe('AIAgent - isMCPserver', () => {

    it('should return true for MCP server component', () => {

        const context = {
            flowDescriptor: {
                'mcp-comp-1': {
                    type: 'appmixer.mcpservers.MCPServer'
                }
            }
        };

        const result = AIAgent.isMCPserver(context, 'mcp-comp-1');
        assert.strictEqual(result, true, 'should return true for MCP server component');
    });

    it('should return false for non-MCP server component', () => {

        const context = {
            flowDescriptor: {
                'normal-comp-1': {
                    type: 'appmixer.ai.agenttools.ToolStart'
                }
            }
        };

        const result = AIAgent.isMCPserver(context, 'normal-comp-1');
        assert.strictEqual(result, false, 'should return false for non-MCP server component');
    });

    it('should return false when component does not exist', () => {

        const context = {
            flowDescriptor: {}
        };

        const result = AIAgent.isMCPserver(context, 'non-existent-comp');
        assert.strictEqual(result, false, 'should return false when component does not exist');
    });
});

describe('AIAgent - instructions', () => {

    const INSTRUCTIONS = 'Answer in plain text only.';

    let sandbox;
    let context;
    let createCompletion;

    beforeEach(async () => {
        context = createMockContext({
            auth: { apiKey: 'test-api-key' },
            properties: { instructions: INSTRUCTIONS, model: 'gpt-4o' },
            messages: { in: { correlationId: 'corr-1', content: { prompt: 'First question' } } }
        });
        // No tools, so receive() does not collect them from the flow descriptor.
        await context.stateSet('tools', []);

        sandbox = sinon.createSandbox();
        sandbox.stub(AIAgent, 'publishChatProgressEvent').resolves();
        createCompletion = sandbox.stub(AIAgent, 'createCompletion').callsFake(async (ctx, client, completion) => {
            return {
                finish_reason: 'stop',
                message: { role: 'assistant', content: `Answer ${completion.messages.length}` }
            };
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should send the instructions ahead of the prompt', async () => {

        await AIAgent.receive(context);

        const { messages } = createCompletion.firstCall.args[2];
        assert.deepStrictEqual(messages, [
            { role: 'user', content: INSTRUCTIONS },
            { role: 'user', content: 'First question' }
        ]);
    });

    it('should prefer the instructions from the input port', async () => {

        context.messages.in.content.instructions = 'Answer in Czech.';

        await AIAgent.receive(context);

        const { messages } = createCompletion.firstCall.args[2];
        assert.deepStrictEqual(messages[0], { role: 'user', content: 'Answer in Czech.' });
    });

    it('should send the instructions once per request in a thread and keep them out of its history', async () => {

        context.messages.in.content.threadId = 'thread-1';
        await AIAgent.receive(context);

        context.messages.in.content.prompt = 'Second question';
        await AIAgent.receive(context);

        const { messages } = createCompletion.secondCall.args[2];
        assert.deepStrictEqual(messages, [
            { role: 'user', content: INSTRUCTIONS },
            { role: 'user', content: 'First question' },
            { role: 'assistant', content: 'Answer 2' },
            { role: 'user', content: 'Second question' }
        ]);

        const history = JSON.parse(await context.stateGet('thread_summary_thread-1'));
        assert.strictEqual(history.length, 4);
        assert(history.every((message) => message.content !== INSTRUCTIONS), 'instructions should not be stored');
    });
});

describe('AIAgent - tool port', () => {

    const AGENT_ID = 'agent-1';
    const TOOL_NAME = 'rows-1_Employee_contacts';

    let sandbox;
    let context;

    beforeEach(() => {
        context = createMockContext({
            componentId: AGENT_ID,
            messages: { in: { correlationId: 'corr-1', content: { prompt: 'Who is the CEO?' } } },
            flowDescriptor: {
                [AGENT_ID]: { type: 'appmixer.ai.openai.AIAgent' },
                'rows-1': {
                    type: 'appmixer.google.spreadsheets.GetRows',
                    label: 'Employee contacts',
                    source: { in: { [AGENT_ID]: ['tool'] } },
                    config: {
                        transform: {
                            in: {
                                [AGENT_ID]: {
                                    tool: {
                                        modifiers: {
                                            sheetId: {},
                                            filter: {
                                                'var-1': {
                                                    variable: `$.${AGENT_ID}.tool.modelDefinedParameter`,
                                                    functions: []
                                                }
                                            }
                                        },
                                        lambda: { sheetId: 'sheet-1', filter: '{{{var-1}}}' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        context.callAppmixer = sinon.stub().callsFake(async ({ endPoint }) => {
            if (endPoint.startsWith('/components?selector=')) {
                return [{
                    name: 'appmixer.google.spreadsheets.GetRows',
                    description: 'Get rows from a sheet.',
                    inPorts: [{
                        name: 'in',
                        schema: {
                            type: 'object',
                            properties: { sheetId: { type: 'string' }, filter: { type: 'string' } },
                            required: ['sheetId']
                        },
                        inspector: { inputs: { filter: { label: 'Filter', tooltip: 'Rows to return.' } } }
                    }]
                }];
            }
            return { rows: [['Jane Doe', 'CEO']] };
        });

        sandbox = sinon.createSandbox();
        sandbox.stub(AIAgent, 'publishChatProgressEvent').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should expose a component wired to the tool port as a tool', async () => {

        const tools = await AIAgent.getAllToolsDefinition(context);

        assert.deepStrictEqual(tools, [{
            type: 'function',
            function: {
                name: TOOL_NAME,
                description: 'Employee contacts - Get rows from a sheet.',
                parameters: {
                    type: 'object',
                    properties: { filter: { type: 'string', description: 'Filter — Rows to return.' } }
                }
            }
        }]);
    });

    it('should call the component directly with the model arguments and the static values', async () => {

        await AIAgent.getAllToolsDefinition(context);

        const outputs = await AIAgent.callTools(context, [{
            id: 'call-1',
            function: { name: TOOL_NAME, arguments: '{"filter":"CEO","sheetId":"other"}' }
        }]);

        assert.deepStrictEqual(outputs, [{
            tool_call_id: 'call-1',
            output: JSON.stringify({ rows: [['Jane Doe', 'CEO']] }, null, 2)
        }]);
        const call = context.callAppmixer.lastCall.args[0];
        assert.strictEqual(call.endPoint, '/component/appmixer/google/spreadsheets/GetRows');
        assert.deepStrictEqual(call.body, {
            componentId: 'rows-1',
            messages: { in: { filter: 'CEO', sheetId: 'sheet-1' } }
        });
        assert(context.sendJson.notCalled, 'nothing should be sent to the tools port');
    });
});

describe('AIAgent - tool port with a model defined embedding', () => {

    const AGENT_ID = 'agent-1';
    const TOOL_NAME = 'query-1_Search_policies';

    let sandbox;
    let context;
    let embed;

    beforeEach(() => {
        context = createMockContext({
            componentId: AGENT_ID,
            messages: { in: { correlationId: 'corr-1', content: { prompt: 'Is there a password policy?' } } },
            flowDescriptor: {
                [AGENT_ID]: { type: 'appmixer.ai.openai.AIAgent' },
                'query-1': {
                    type: 'appmixer.pinecone.database.QueryVectors',
                    label: 'Search policies',
                    source: { in: { [AGENT_ID]: ['tool'] } },
                    config: {
                        transform: {
                            in: {
                                [AGENT_ID]: {
                                    tool: {
                                        modifiers: {
                                            index: {},
                                            vector: {
                                                'var-1': {
                                                    variable: `$.${AGENT_ID}.tool.modelDefinedEmbedding`,
                                                    functions: []
                                                }
                                            }
                                        },
                                        lambda: { index: 'policies', vector: '{{{var-1}}}' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        context.callAppmixer = sinon.stub().callsFake(async ({ endPoint }) => {
            if (endPoint.startsWith('/components?selector=')) {
                return [{
                    name: 'appmixer.pinecone.database.QueryVectors',
                    description: 'Query Pinecone for vectors.',
                    inPorts: [{
                        name: 'in',
                        schema: {
                            type: 'object',
                            properties: {
                                index: { type: 'string' },
                                vector: { oneOf: [{ type: 'array' }, { type: 'string' }] }
                            },
                            required: ['index', 'vector']
                        },
                        inspector: { inputs: { vector: { label: 'Vector', tooltip: 'The query vector.' } } }
                    }]
                }];
            }
            return { result: { matches: [] } };
        });

        sandbox = sinon.createSandbox();
        sandbox.stub(AIAgent, 'publishChatProgressEvent').resolves();
        embed = sandbox.stub(AIAgent, 'embed').resolves([0.1, 0.2, 0.3]);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should ask the model for a text, not for a vector', async () => {

        const tools = await AIAgent.getAllToolsDefinition(context);

        assert.deepStrictEqual(tools, [{
            type: 'function',
            function: {
                name: TOOL_NAME,
                description: 'Search policies - Query Pinecone for vectors.',
                parameters: {
                    type: 'object',
                    properties: {
                        vector: {
                            type: 'string',
                            description: 'Text to search for. It is converted to an embedding vector before the call.'
                        }
                    },
                    required: ['vector']
                }
            }
        }]);
    });

    it('should call the component with the embedding of the text', async () => {

        await AIAgent.getAllToolsDefinition(context);

        await AIAgent.callTools(context, [{
            id: 'call-1',
            function: { name: TOOL_NAME, arguments: '{"vector":"password policy"}' }
        }]);

        assert.strictEqual(embed.firstCall.args[1], 'password policy');
        assert.deepStrictEqual(context.callAppmixer.lastCall.args[0].body, {
            componentId: 'query-1',
            messages: { in: { vector: [0.1, 0.2, 0.3], index: 'policies' } }
        });
    });

    it('should hand an embedding failure back to the model instead of calling the component', async () => {

        await AIAgent.getAllToolsDefinition(context);
        embed.rejects(new Error('model not found'));
        const callsBefore = context.callAppmixer.callCount;

        const outputs = await AIAgent.callTools(context, [{
            id: 'call-1',
            function: { name: TOOL_NAME, arguments: '{"vector":"password policy"}' }
        }]);

        assert.strictEqual(context.callAppmixer.callCount, callsBefore);
        assert.match(outputs[0].output, /could not create the embedding for "vector": model not found/);
    });
});
