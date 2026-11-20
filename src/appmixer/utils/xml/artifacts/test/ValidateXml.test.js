const assert = require('assert');
const testUtils = require('../../../../../../test/utils.js');
const ValidateXml = require('../../ValidateXml/ValidateXml');

// Pins the fast-xml-parser XMLValidator results, including the error codes, messages and
// positions the component passes on.
describe('ValidateXml', () => {

    async function validate(xml, options = {}) {

        const context = {
            ...testUtils.createMockContext(),
            messages: { in: { content: { xml, ...options } } }
        };
        await ValidateXml.receive(context);
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
        return context.sendJson.getCall(0).args[0];
    }

    [
        ['a simple document', '<a><b>1</b><c>two</c></a>'],
        ['a declaration, attributes and CRLF', '<?xml version="1.0" encoding="UTF-8"?>\r\n<a x="1" y=\'z\'>\r\n  <b>t</b>\r\n</a>'],
        ['CDATA, comments and entities', '<a><![CDATA[<x>&amp;</x>]]><!-- c --><b>&lt;&#65;&#x42;</b></a>'],
        ['namespaces', '<s:Envelope xmlns:s="http://x"><s:Body><m:Id xmlns:m="u">5</m:Id></s:Body></s:Envelope>'],
        ['self-closing and empty tags', '<r><k/><l></l></r>']
    ].forEach(([title, xml]) => {

        it(`should accept ${title}`, async () => {

            assert.deepStrictEqual(await validate(xml), { isValid: true, err: {} });
        });
    });

    it('should report an unclosed tag', async () => {

        assert.deepStrictEqual(await validate('<a><b>1</b>'), {
            isValid: false,
            err: { code: 'InvalidTag', msg: 'Unclosed tag \'a\'.', line: 1, col: 1 }
        });
    });

    it('should report a mismatched closing tag', async () => {

        assert.deepStrictEqual(await validate('<a><b>1</c></a>'), {
            isValid: false,
            err: {
                code: 'InvalidTag',
                msg: 'Expected closing tag \'b\' (opened in line 1, col 4) instead of closing tag \'c\'.',
                line: 1,
                col: 8
            }
        });
    });

    it('should report several root nodes', async () => {

        assert.deepStrictEqual(await validate('<a>1</a><b>2</b>'), {
            isValid: false,
            err: { code: 'InvalidXml', msg: 'Multiple possible root nodes found.', line: 1, col: 11 }
        });
    });

    it('should report an empty input', async () => {

        const result = await validate('');

        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.err.code, 'InvalidXml');
        assert.strictEqual(result.err.msg, 'Start tag expected.');
    });

    it('should reject a boolean attribute unless allowBooleanAttributes is set', async () => {

        const xml = '<a id="007" flag><b>1</b></a>';

        assert.deepStrictEqual(await validate(xml), {
            isValid: false,
            err: { code: 'InvalidAttr', msg: 'boolean attribute \'flag\' is not allowed.', line: 1, col: 13 }
        });
        assert.deepStrictEqual(await validate(xml, { allowBooleanAttributes: true }), { isValid: true, err: {} });
    });

    it('should reject unpaired tags unless they are listed in unpairedTags', async () => {

        const xml = '<r><br><p>x<br>y</p><img src="a"></r>';

        const result = await validate(xml);
        assert.strictEqual(result.isValid, false);
        assert.strictEqual(result.err.code, 'InvalidTag');

        assert.deepStrictEqual(await validate(xml, { unpairedTags: 'br, img' }), { isValid: true, err: {} });
    });
});
