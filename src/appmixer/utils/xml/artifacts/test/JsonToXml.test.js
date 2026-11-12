const assert = require('assert');
const testUtils = require('../../../../../../test/utils.js');
const JsonToXml = require('../../JsonToXml/JsonToXml');

describe('JsonToXml', () => {

    let context;

    beforeEach(() => {
        context = {
            ...testUtils.createMockContext(),
            messages: {
                in: {
                    content: {
                        json: '{"foo":"bar"}',
                        attributeNamePrefix: '@',
                        format: false,
                        ignoreAttributes: false,
                        preserveOrder: false,
                        processEntities: false,
                        suppressBooleanAttributes: false,
                        suppressEmptyNode: false,
                        suppressUnpairedNode: false
                    }
                }
            }
        };
    });

    it('should convert simple JSON to XML', async () => {

        await JsonToXml.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.getCall(0).args[0];
        assert.ok(result.xml, 'Result should contain xml property');
        assert.ok(result.xml.includes('<foo>bar</foo>'), 'XML should contain <foo>bar</foo>');
    });

    it('should handle format:true with indentBy not provided (undefined)', async () => {

        context.messages.in.content.format = true;

        await JsonToXml.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.getCall(0).args[0];
        assert.ok(result.xml, 'Result should contain xml property');
    });

    it('should handle JSON object input (not string)', async () => {

        context.messages.in.content.json = { foo: 'bar' };

        await JsonToXml.receive(context);

        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        const result = context.sendJson.getCall(0).args[0];
        assert.ok(result.xml.includes('<foo>bar</foo>'), 'XML should contain <foo>bar</foo>');
    });

    // fast-xml-parser 5.12.0 throws a TypeError on a null/undefined input; the component keeps
    // returning an empty XML, as it did on 5.7.3.
    [
        ['an unset JSON input', undefined],
        ['a null JSON input', null],
        ['the JSON string "null"', 'null'],
        ['an empty object', {}]
    ].forEach(([title, json]) => {

        it(`should return an empty XML for ${title}`, async () => {

            context.messages.in.content.json = json;

            await JsonToXml.receive(context);

            assert(context.sendJson.calledOnce, 'sendJson should be called once');
            assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ xml: '' }, 'out']);
        });
    });

    it('should return an empty XML for a null JSON input with preserveOrder', async () => {

        context.messages.in.content.json = null;
        context.messages.in.content.preserveOrder = true;

        await JsonToXml.receive(context);

        assert.deepStrictEqual(context.sendJson.getCall(0).args, [{ xml: '' }, 'out']);
    });
});
