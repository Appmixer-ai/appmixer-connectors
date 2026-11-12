'use strict';

const assert = require('assert');
const sinon = require('sinon');

const componentTool = require('../../tool');

describe('ai.agent tool results', () => {

    function createContext(config = {}, result) {

        return {
            config,
            messages: { in: {} },
            log: sinon.stub().resolves(),
            callAppmixer: sinon.stub().resolves(result)
        };
    }

    const truncations = context => context.log.getCalls()
        .map(call => call.args[0])
        .filter(entry => entry.step === 'tool-result-truncated');

    describe('createToolResultFormatter', () => {

        it('returns strings as they are and objects as compact JSON', async () => {

            const context = createContext();
            const format = componentTool.createToolResultFormatter(context);

            assert.strictEqual(await format('plain text', 'tool'), 'plain text');
            assert.strictEqual(await format({ a: 1, b: [1, 2] }, 'tool'), '{"a":1,"b":[1,2]}');
            assert.strictEqual(await format(undefined, 'tool'), 'undefined');
            assert.deepStrictEqual(truncations(context), []);
        });

        it('passes a large result whole while the turn has room for it', async () => {

            const context = createContext();
            const format = componentTool.createToolResultFormatter(context);

            assert.strictEqual((await format('x'.repeat(150000), 'tool')).length, 150000);
            // The second one no longer fits into the turn's total (240000 by default).
            assert.match(await format('x'.repeat(150000), 'tool'), /showing the first 90000 of 150000/);
            assert.strictEqual(truncations(context).length, 1);
        });

        it('cuts a result over the per-result limit and tells the model', async () => {

            const context = createContext({ AI_AGENT_MAX_TOOL_RESULT_CHARS: 1000 });
            const format = componentTool.createToolResultFormatter(context);

            const text = await format({ rows: 'x'.repeat(5000) }, 'listRows');

            assert.ok(text.startsWith('{"rows":"xxx'));
            assert.match(text, /\[Result truncated: showing the first 1000 of 5011 characters\./);
            assert.ok(text.length < 1300);
            assert.deepStrictEqual(truncations(context), [
                { step: 'tool-result-truncated', displayName: 'listRows', length: 5011, limit: 1000 }
            ]);
        });

        it('limits the total of all results of a turn', async () => {

            const context = createContext({
                AI_AGENT_MAX_TOOL_RESULT_CHARS: 1000,
                AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS: 2500
            });
            const format = componentTool.createToolResultFormatter(context);

            let total = 0;
            for (let i = 0; i < 20; i++) {
                total += (await format('y'.repeat(900), 'tool')).length;
            }

            // Two results fit whole, the third is cut to what is left and the rest to the minimum.
            assert.ok(total < 2500 + 18 * 800, `total ${total}`);
            assert.strictEqual(truncations(context).length, 18);
            assert.strictEqual(truncations(context).pop().limit, 500);
        });

        it('derives the limit from the context window of the model', async () => {

            assert.strictEqual(componentTool.toolResultsLimit(undefined), 240000);
            assert.strictEqual(componentTool.toolResultsLimit(200000), 300000);
            assert.strictEqual(componentTool.toolResultsLimit(1000000), 1500000);

            const context = createContext();
            const format = componentTool.createToolResultFormatter(context, { contextWindow: 1000000 });
            assert.strictEqual((await format('x'.repeat(1200000), 'tool')).length, 1200000);
            assert.match(await format('x'.repeat(400000), 'tool'), /showing the first 300000 of 400000/);
        });

        it('lets the configured limit override the one derived from the model', async () => {

            const context = createContext({ AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS: 1000 });
            const format = componentTool.createToolResultFormatter(context, { contextWindow: 1000000 });
            assert.match(await format('x'.repeat(5000), 'tool'), /showing the first 1000 of 5000/);
        });

        it('starts with a full budget on the next turn', async () => {

            const context = createContext({ AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS: 1000 });
            await componentTool.createToolResultFormatter(context)('z'.repeat(5000), 'tool');

            const text = await componentTool.createToolResultFormatter(context)('z'.repeat(800), 'tool');
            assert.strictEqual(text.length, 800);
        });
    });

    describe('component tools', () => {

        const toolDef = {
            type: 'function',
            function: {
                name: 'c1_ListRows',
                description: 'Lists rows.',
                parameters: { type: 'object', properties: {} },
                _componentId: 'c1',
                _componentType: 'appmixer.test.core.ListRows',
                _inPort: 'in',
                _userStaticValues: {}
            }
        };

        it('caps what a component returns to the model', async () => {

            const rows = Array.from({ length: 2000 }, (_, i) => ({ id: i, name: `Row number ${i}` }));
            const context = createContext({ AI_AGENT_MAX_TOOL_RESULT_CHARS: 2000 }, { result: rows });
            const tools = componentTool.buildComponentVercelTools(context, [toolDef]);

            const text = await tools['c1_ListRows'].execute({}, { toolCallId: 'call-1' });

            assert.ok(text.length < 2300, `length ${text.length}`);
            assert.match(text, /Result truncated/);
            // The log keeps the whole result.
            const logged = context.log.getCalls().map(call => call.args[0])
                .find(entry => entry.step === 'component-tool-result');
            assert.strictEqual(logged.result.result.length, 2000);
        });

        it('shares the total between the tools of a turn', async () => {

            const context = createContext(
                { AI_AGENT_MAX_TOOL_RESULTS_TOTAL_CHARS: 1500 },
                'r'.repeat(1000)
            );
            const other = { ...toolDef, function: { ...toolDef.function, name: 'c2_ListRows', _componentId: 'c2' } };
            const tools = componentTool.buildComponentVercelTools(context, [toolDef, other]);

            const first = await tools['c1_ListRows'].execute({});
            const second = await tools['c2_ListRows'].execute({});

            assert.strictEqual(first.length, 1000);
            assert.match(second, /showing the first 500 of 1000 characters/);
        });
    });
});
