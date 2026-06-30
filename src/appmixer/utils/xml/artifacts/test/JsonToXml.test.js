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
});
