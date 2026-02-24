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
