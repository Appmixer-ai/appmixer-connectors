'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../../test/utils');

const lib = require('../../lib');

describe('OpenRouter AIAgent - mcpCallTool with correlationId', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should pass correlationId from context.messages.in.correlationId to mcpCallTool request', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: 'test-correlation-id-456'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        await lib.mcpCallTool(context, 'mcp-component-id', 'testTool', { arg1: 'value1' });

        assert(context.httpRequest.calledOnce, 'httpRequest should be called once');

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            callArgs.data.correlationId,
            'test-correlation-id-456',
            'correlationId should be passed in request data'
        );
    });

    it('should include tool name and arguments in mcpCallTool request', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: 'correlation-456'
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        const toolName = 'analyzeText';
        const toolArgs = { text: 'sample text', language: 'en' };

        await lib.mcpCallTool(context, 'mcp-component-id', toolName, toolArgs);

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.name, toolName, 'tool name should match');
        assert.deepStrictEqual(callArgs.data.arguments, toolArgs, 'tool arguments should match');
    });

    it('should handle missing correlationId gracefully in openrouter', async () => {

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

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        await lib.mcpCallTool(context, 'mcp-component-id', 'testTool', { arg1: 'value1' });

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(
            callArgs.data.correlationId,
            undefined,
            'correlationId should be undefined when not provided'
        );
    });

    it('should make POST request to correct mcpCallTool endpoint', async () => {

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

        await lib.mcpCallTool(context, 'mcp-component-id', 'testTool', {});

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.method, 'POST', 'HTTP method should be POST');
        assert(
            callArgs.url.includes('flow-123'),
            'URL should include flow ID'
        );
        assert(
            callArgs.url.includes('mcp-component-id'),
            'URL should include component ID'
        );
        assert(
            callArgs.url.includes('callTool'),
            'URL should include callTool action'
        );
    });

    it('should return MCP server tool call response data', async () => {

        const expectedResponse = {
            result: 'tool execution successful',
            data: { key: 'value' }
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
                data: expectedResponse
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        const result = await lib.mcpCallTool(context, 'mcp-component-id', 'testTool', {});

        assert.deepStrictEqual(result, expectedResponse, 'should return the MCP tool call response');
    });

    it('should preserve correlationId across multiple mcpCallTool calls', async () => {

        const correlationId = 'persistent-correlation-id';
        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        await lib.mcpCallTool(context, 'mcp-comp-1', 'tool1', {});
        await lib.mcpCallTool(context, 'mcp-comp-2', 'tool2', {});
        await lib.mcpCallTool(context, 'mcp-comp-3', 'tool3', {});

        assert.strictEqual(context.httpRequest.callCount, 3, 'should make 3 httpRequest calls');

        for (let i = 0; i < 3; i++) {
            const callArgs = context.httpRequest.getCall(i).args[0];
            assert.strictEqual(
                callArgs.data.correlationId,
                correlationId,
                `correlationId should be preserved in call ${i + 1}`
            );
        }
    });

    it('should handle empty correlationId', async () => {

        const context = createMockContext({
            flowId: 'test-flow-id',
            componentId: 'test-component-id',
            messages: {
                in: {
                    correlationId: ''
                }
            },
            httpRequest: sandbox.stub().resolves({
                data: {
                    result: 'success'
                }
            })
        });

        process.env.APPMIXER_API_URL = 'https://api.example.com';

        await lib.mcpCallTool(context, 'mcp-component-id', 'testTool', {});

        const callArgs = context.httpRequest.firstCall.args[0];
        assert.strictEqual(callArgs.data.correlationId, '', 'empty correlationId should be passed as-is');
    });
});
