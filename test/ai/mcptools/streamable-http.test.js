'use strict';

const path = require('path');
const assert = require('assert');
const sinon = require('sinon');
const { createMockContext } = require('../../utils');

const streamableHttp = require(
    path.join(__dirname, '../../../src/appmixer/ai/mcptools/streamable-http.js'));

const USER_ID = 'user-1';
const REGISTRY_KEY = `mcpgateways:user:${USER_ID}`;
const WEBHOOK = 'https://api.example.appmixer.cloud/flow/FLOW1/component/COMP1';

function toolDef(name, { description, parameters } = {}) {
    return {
        type: 'function',
        function: {
            name,
            description: description || `${name} description`,
            ...(parameters ? { parameters } : {})
        }
    };
}

describe('ai.mcptools streamable-http', function() {

    let context;

    beforeEach(function() {
        context = createMockContext();
        // The shared mock logs to stdout; the protocol layer logs on every handled
        // error, which would drown the test output.
        context.log = sinon.stub();
    });

    const registerGateways = (gateways) => context.service.stateSet(REGISTRY_KEY, gateways);

    const send = (message) => streamableHttp.handleMessage(context, { message, userId: USER_ID });

    const request = (method, params) => send({ jsonrpc: '2.0', id: 1, method, params });

    describe('normalizeInputSchema', function() {

        it('turns a missing parameters block into an empty object schema', function() {
            // MCP requires inputSchema; gateway defs omit `parameters` when the
            // component has no model-defined fields.
            assert.deepStrictEqual(
                streamableHttp.normalizeInputSchema(undefined),
                { type: 'object', properties: {} });
        });

        it('fills in a missing properties map', function() {
            assert.deepStrictEqual(
                streamableHttp.normalizeInputSchema({ type: 'object' }),
                { type: 'object', properties: {} });
        });

        it('preserves a complete schema', function() {
            const schema = { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] };
            assert.deepStrictEqual(streamableHttp.normalizeInputSchema(schema), schema);
        });
    });

    describe('deriveTitle', function() {

        it('drops the opaque component id prefix', function() {
            assert.strictEqual(streamableHttp.deriveTitle('bX7kQ2_Send_Email'), 'Send Email');
        });

        it('falls back to the raw name when there is no prefix', function() {
            assert.strictEqual(streamableHttp.deriveTitle('SendEmail'), 'SendEmail');
        });
    });

    describe('tools/list', function() {

        it('returns an empty list when the user has no gateways', async function() {
            const response = await request('tools/list');
            assert.deepStrictEqual(response.result.tools, []);
        });

        it('flattens tools across gateways into MCP tool shape', async function() {
            registerGateways([
                { flowId: 'f1', componentId: 'c1', webhook: WEBHOOK, tools: [toolDef('c1_Alpha')] },
                {
                    flowId: 'f2',
                    componentId: 'c2',
                    webhook: WEBHOOK,
                    tools: [toolDef('c2_Beta', {
                        parameters: { type: 'object', properties: { q: { type: 'string' } } }
                    })]
                }
            ]);

            const { tools } = (await request('tools/list')).result;

            assert.deepStrictEqual(tools, [
                {
                    name: 'c1_Alpha',
                    title: 'Alpha',
                    description: 'c1_Alpha description',
                    inputSchema: { type: 'object', properties: {} }
                },
                {
                    name: 'c2_Beta',
                    title: 'Beta',
                    description: 'c2_Beta description',
                    inputSchema: { type: 'object', properties: { q: { type: 'string' } } }
                }
            ]);
        });

        it('drops duplicate tool names so dispatch stays deterministic', async function() {
            registerGateways([
                { flowId: 'f1', componentId: 'c1', webhook: WEBHOOK, tools: [toolDef('c1_Alpha')] },
                { flowId: 'f2', componentId: 'c1', webhook: 'https://other', tools: [toolDef('c1_Alpha')] }
            ]);

            const { tools } = (await request('tools/list')).result;
            assert.strictEqual(tools.length, 1);
        });

        it('is scoped to the authenticated user', async function() {
            registerGateways([{ flowId: 'f1', componentId: 'c1', webhook: WEBHOOK, tools: [toolDef('c1_Alpha')] }]);

            const response = await streamableHttp.handleMessage(
                context, { message: { jsonrpc: '2.0', id: 1, method: 'tools/list' }, userId: 'someone-else' });

            assert.deepStrictEqual(response.result.tools, []);
        });
    });

    describe('tools/call', function() {

        beforeEach(function() {
            registerGateways([{
                flowId: 'f1',
                componentId: 'c1',
                webhook: WEBHOOK,
                tools: [toolDef('c1_Alpha')]
            }]);
        });

        it('posts the gateway webhook body the MCPGateway webhook expects', async function() {
            context.httpRequest.resolves({ data: 'done' });

            const response = await request('tools/call', { name: 'c1_Alpha', arguments: { q: 'hi' } });

            const call = context.httpRequest.firstCall.args[0];
            assert.strictEqual(call.method, 'POST');
            assert.strictEqual(call.url, WEBHOOK);
            assert.deepStrictEqual(call.data, { function: { name: 'c1_Alpha', arguments: { q: 'hi' } } });
            assert.deepStrictEqual(response.result, { content: [{ type: 'text', text: 'done' }], isError: false });
        });

        it('stringifies a non-string tool output', async function() {
            context.httpRequest.resolves({ data: { ok: true } });

            const response = await request('tools/call', { name: 'c1_Alpha' });

            assert.strictEqual(response.result.content[0].text, JSON.stringify({ ok: true }, null, 2));
            assert.strictEqual(response.result.isError, false);
        });

        it('defaults missing arguments to an empty object', async function() {
            context.httpRequest.resolves({ data: 'done' });

            await request('tools/call', { name: 'c1_Alpha' });

            assert.deepStrictEqual(context.httpRequest.firstCall.args[0].data.function.arguments, {});
        });

        it('reports a failing tool as isError, not a protocol error', async function() {
            const err = new Error('Request failed');
            err.response = { data: 'Unknown tool: c1_Alpha' };
            context.httpRequest.rejects(err);

            const response = await request('tools/call', { name: 'c1_Alpha' });

            assert.strictEqual(response.result.isError, true);
            assert.match(response.result.content[0].text, /Unknown tool: c1_Alpha/);
            assert.strictEqual(response.error, undefined);
        });

        it('rejects an unknown tool with invalid params', async function() {
            const response = await request('tools/call', { name: 'nope' });

            assert.strictEqual(response.error.code, streamableHttp.INVALID_PARAMS);
            assert.match(response.error.message, /Unknown tool: nope/);
            assert.strictEqual(context.httpRequest.called, false);
        });

        it('rejects a missing tool name', async function() {
            const response = await request('tools/call', {});
            assert.strictEqual(response.error.code, streamableHttp.INVALID_PARAMS);
        });

        it('rejects non-object arguments', async function() {
            const response = await request('tools/call', { name: 'c1_Alpha', arguments: ['a'] });
            assert.strictEqual(response.error.code, streamableHttp.INVALID_PARAMS);
        });
    });

    describe('initialize', function() {

        it('echoes a supported protocol version', async function() {
            const response = await request('initialize', { protocolVersion: '2025-03-26' });
            assert.strictEqual(response.result.protocolVersion, '2025-03-26');
        });

        it('falls back to the latest version when the client asks for an unknown one', async function() {
            const response = await request('initialize', { protocolVersion: '1999-01-01' });
            assert.strictEqual(response.result.protocolVersion, streamableHttp.LATEST_PROTOCOL_VERSION);
        });

        it('advertises only the tools capability, with listChanged', async function() {
            const { capabilities, serverInfo } = (await request('initialize', {})).result;

            assert.deepStrictEqual(capabilities, { tools: { listChanged: true } });
            assert.strictEqual(serverInfo.name, 'Appmixer');
            assert.ok(serverInfo.version);
        });
    });

    describe('envelope handling', function() {

        it('answers ping with an empty result', async function() {
            assert.deepStrictEqual((await request('ping')).result, {});
        });

        it('returns method not found for an unknown method', async function() {
            const response = await request('prompts/list');
            assert.strictEqual(response.error.code, streamableHttp.METHOD_NOT_FOUND);
        });

        it('returns nothing for a notification', async function() {
            assert.strictEqual(await send({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
        });

        it('returns nothing for a client response', async function() {
            assert.strictEqual(await send({ jsonrpc: '2.0', id: 7, result: {} }), null);
        });

        it('rejects a wrong jsonrpc version', async function() {
            const response = await send({ jsonrpc: '1.0', id: 1, method: 'ping' });
            assert.strictEqual(response.error.code, streamableHttp.INVALID_REQUEST);
        });

        it('rejects a non-object message', async function() {
            const response = await send('ping');
            assert.strictEqual(response.error.code, streamableHttp.INVALID_REQUEST);
            assert.strictEqual(response.id, null);
        });

        it('turns an unexpected failure into an internal error', async function() {
            context.service.stateGet = sinon.stub().rejects(new Error('redis down'));

            const response = await request('tools/list');

            assert.strictEqual(response.error.code, streamableHttp.INTERNAL_ERROR);
            assert.match(response.error.message, /redis down/);
        });
    });

    describe('isSupportedProtocolVersion', function() {

        it('accepts every advertised version', function() {
            for (const version of streamableHttp.SUPPORTED_PROTOCOL_VERSIONS) {
                assert.ok(streamableHttp.isSupportedProtocolVersion(version), version);
            }
        });

        it('rejects anything else', function() {
            assert.strictEqual(streamableHttp.isSupportedProtocolVersion('2020-01-01'), false);
            assert.strictEqual(streamableHttp.isSupportedProtocolVersion(undefined), false);
        });
    });
});
