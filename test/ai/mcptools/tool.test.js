'use strict';

// MCP Gateway tool definitions: what the model reads about each tool. The description the user
// wrote on the gateway wins; without one, a labelled component reads '<label>: <what the component
// does>', since the component description alone ("Set value to Storage.") does not say what the
// tool is for. A failed tool call is logged as an error so it counts in the flow's errors.

const assert = require('assert');
const tool = require('../../../src/appmixer/ai/mcptools/tool');

const GATEWAY = 'gw';
const manifest = {
    name: 'appmixer.utils.storage.Set',
    label: 'Set',
    description: 'Set value to Storage.',
    inPorts: [{
        name: 'in',
        schema: { type: 'object', properties: { storeId: { type: 'string' }, key: { type: 'string' }, value: { type: 'string' } }, required: ['storeId', 'key', 'value'] },
        inspector: { inputs: { storeId: { type: 'select', label: 'Storage' }, key: { type: 'text', label: 'Key' }, value: { type: 'text', label: 'Value', tooltip: 'Value to store.' } } }
    }]
};
const ai = (name) => ({ [name]: { variable: `$.${GATEWAY}.tool.modelDefinedParameter`, functions: [] } });
const component = (label) => ({
    type: 'appmixer.utils.storage.Set',
    label,
    source: { in: { [GATEWAY]: ['tool'] } },
    config: { transform: { in: { [GATEWAY]: { tool: { type: 'json2new',
        modifiers: { storeId: {}, key: ai('k'), value: ai('v') },
        lambda: { storeId: 'store-1', key: '{{{k}}}', value: '{{{v}}}' } } } } } }
});
const build = (label, descriptions) => tool.buildComponentToolDef('a7000000-0000-4000-8000-000000000002',
    component(label), manifest, 'in', GATEWAY, descriptions).function;

describe('ai.mcptools tool descriptions', () => {

    it('parses the rows of the Tool descriptions field', () => {
        const map = tool.parseToolDescriptions({ ADD: [
            { tool: ' Save lead ', description: ' Saves a lead. ' },
            { tool: '', description: 'no tool' },
            { tool: 'Empty', description: '' }
        ] });
        assert.deepStrictEqual([...map.entries()], [['save lead', 'Saves a lead.']]);
        assert.strictEqual(tool.parseToolDescriptions(undefined).size, 0);
    });

    it('uses the description written for the tool, matched by label case-insensitively', () => {
        const descriptions = tool.parseToolDescriptions({ ADD: [{ tool: 'save LEAD', description: 'Saves a sales lead.' }] });
        assert.strictEqual(build('Save lead', descriptions).description, 'Saves a sales lead.');
    });

    it('puts the label in front of the component description when there is none', () => {
        assert.strictEqual(build('Save lead', new Map()).description, 'Save lead: Set value to Storage.');
    });

    it('keeps the component description alone for an unlabelled component', () => {
        assert.strictEqual(build(undefined, new Map()).description, 'Set value to Storage.');
        assert.strictEqual(build('Set', new Map()).description, 'Set value to Storage.');
    });

    it('still builds the parameters from the model-defined fields only', () => {
        const { parameters, _userStaticValues: staticValues, _label: label } = build('Save lead', new Map());
        assert.deepStrictEqual(Object.keys(parameters.properties), ['key', 'value']);
        assert.deepStrictEqual(staticValues, { storeId: 'store-1' });
        assert.strictEqual(label, 'Save lead');
    });

    it('does not leak the label into the public tool definition', () => {
        const pub = tool.toPublicToolDef({ type: 'function', function: build('Save lead', new Map()) });
        assert.deepStrictEqual(Object.keys(pub.function).sort(), ['description', 'name', 'parameters']);
    });

    it('logs a failed tool call as an error and returns the error text to the caller', async () => {
        const logs = [];
        const context = {
            log: async (...args) => logs.push(args),
            callAppmixer: async () => { throw new Error('store not found'); }
        };
        const def = { type: 'function', function: build('Save lead', new Map()) };
        const out = await tool.executeComponentTool(context, def, { key: 'acme', value: '{}' });
        assert.match(out, /^Error calling tool .*store not found/);
        const error = logs.find(([level]) => level === 'error');
        assert.ok(error, 'an error entry is logged');
        assert.strictEqual(error[1].step, 'component-tool-call-error');
        assert.deepStrictEqual(error[1].payload, { key: 'acme', value: '{}', storeId: 'store-1' });
    });
});
