const assert = require('assert');
const testUtils = require('../../../../../../test/utils.js');
const XmlToJson = require('../../XmlToJson/XmlToJson');

// Pins the output of the fast-xml-parser XMLParser as the component uses it, so that a dependency
// bump which changes the parsing shows up here.
describe('XmlToJson', () => {

    async function convert(xml, options = {}) {

        const context = {
            ...testUtils.createMockContext(),
            messages: { in: { content: { xml, ...options } } }
        };
        await XmlToJson.receive(context);
        assert(context.sendJson.calledOnce, 'sendJson should be called once');
        assert.strictEqual(context.sendJson.getCall(0).args[1], 'out');
        return context.sendJson.getCall(0).args[0].json;
    }

    it('should convert elements, repeated tags and empty tags', async () => {

        const json = await convert('<r><i>1</i><i>2</i><j>three</j><k/><l></l></r>', { parseTagValue: true });

        assert.deepStrictEqual(json, { r: { i: [1, 2], j: 'three', k: '', l: '' } });
    });

    it('should keep tag values as strings when parseTagValue is unset', async () => {

        const json = await convert('<a><b>1</b><c>two</c></a>');

        assert.deepStrictEqual(json, { a: { b: '1', c: 'two' } });
    });

    it('should parse attributes, boolean attributes and attribute values', async () => {

        const json = await convert('<a id="007" flag hex="0x1F"><b n="1.50">001</b><b>0x10</b><b> pad </b></a>', {
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true,
            allowBooleanAttributes: true
        });

        assert.deepStrictEqual(json, {
            a: {
                b: [{ '': '001', '@_n': 1.5 }, '0x10', ' pad '],
                '@_id': '007',
                '@_flag': true,
                '@_hex': '0x1F'
            }
        });
    });

    it('should group attributes under attributesGroupName', async () => {

        const json = await convert('<a x="1" y="z"><b>t</b></a>', {
            ignoreAttributes: false,
            attributesGroupName: '$',
            attributeNamePrefix: ''
        });

        assert.deepStrictEqual(json, { a: { b: 't', $: { x: '1', y: 'z' } } });
    });

    it('should keep CDATA and comments in document order with preserveOrder', async () => {

        const xml = '<a><![CDATA[<x>&amp;</x>]]><!-- c --><b>&lt;&gt;&amp;&quot;&apos;</b></a>';
        const json = await convert(xml, {
            preserveOrder: true,
            ignoreAttributes: false,
            cdataPropName: '__cdata',
            commentPropName: '__c'
        });

        assert.deepStrictEqual(json, [{
            a: [
                { __cdata: [{ '': '<x>&amp;</x>' }] },
                { __c: [{ '': ' c ' }] },
                { b: [{ '': '<>&"\'' }] }
            ]
        }]);
    });

    it('should decode the XML entities and DOCTYPE entities', async () => {

        assert.deepStrictEqual(
            await convert('<a>Tom &amp; Jerry &lt;3 &quot;x&quot;</a>'),
            { a: 'Tom & Jerry <3 "x"' }
        );
        assert.deepStrictEqual(
            await convert('<!DOCTYPE a [<!ENTITY e "ent">]><a>&e; &unknown;</a>'),
            { a: 'ent &unknown;' }
        );
    });

    it('should leave entities alone when processEntities is false', async () => {

        const json = await convert('<a>Tom &amp; Jerry</a>', { processEntities: false });

        assert.deepStrictEqual(json, { a: 'Tom &amp; Jerry' });
    });

    it('should remove namespace prefixes, the declaration and processing instructions', async () => {

        const xml = '<?xml version="1.0"?><?xml-stylesheet href="s.xsl"?>'
            + '<s:Envelope xmlns:s="http://x"><s:Body><m:Id xmlns:m="u">5</m:Id></s:Body></s:Envelope>';
        const json = await convert(xml, { removeNSPrefix: true, ignoreDeclaration: true, ignorePiTags: true });

        assert.deepStrictEqual(json, { Envelope: { Body: { Id: '5' } } });
    });

    it('should turn only the alwaysArray paths into arrays', async () => {

        const json = await convert('<r><i>1</i><j>2</j></r>', { alwaysArray: 'r.i' });

        assert.deepStrictEqual(json, { r: { i: ['1'], j: '2' } });
    });

    it('should respect the number parsing options', async () => {

        const xml = '<a><b>007</b><c>0x1F</c><d>1.50</d><e>+420123</e></a>';

        assert.deepStrictEqual(
            await convert(xml, { parseTagValue: true, numberParseLeadingZeros: true, numberParseHex: true }),
            { a: { b: 7, c: 31, d: 1.5, e: 420123 } }
        );
        assert.deepStrictEqual(
            await convert(xml, {
                parseTagValue: true,
                numberParseLeadingZeros: false,
                numberParseHex: false,
                numberParseSkipLike: '^\\+'
            }),
            { a: { b: '007', c: '0x1F', d: 1.5, e: '+420123' } }
        );
    });

    it('should keep the raw content of a stop node', async () => {

        const json = await convert('<r><s>a <b>bold</b> c</s><d>1</d></r>', { stopNodes: 'r.s' });

        assert.deepStrictEqual(json, { r: { s: 'a <b>bold</b> c', d: '1' } });
    });

    it('should accept unpaired tags', async () => {

        const json = await convert('<r><p>x<br>y</p><img src="a"></r>', {
            unpairedTags: 'br, img',
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text'
        });

        assert.deepStrictEqual(json, { r: { p: { '#text': 'xy', br: '' }, img: { '@_src': 'a' } } });
    });

    it('should keep whitespace when trimValues is false and always create text nodes', async () => {

        const json = await convert('<a><b> pad </b></a>', {
            trimValues: false,
            alwaysCreateTextNode: true,
            textNodeName: '#t'
        });

        assert.deepStrictEqual(json, { a: { b: { '#t': ' pad ' } } });
    });

    it('should handle CRLF line ends and non-ASCII characters', async () => {

        const json = await convert('<?xml version="1.0" encoding="UTF-8"?>\r\n<a>\r\n  <b>Příliš žluťoučký 🐎</b>\r\n</a>', {
            ignoreDeclaration: true,
            trimValues: true
        });

        assert.deepStrictEqual(json, { a: { b: 'Příliš žluťoučký 🐎' } });
    });

    it('should return an empty object for an empty input and for plain text', async () => {

        assert.deepStrictEqual(await convert(''), {});
        assert.deepStrictEqual(await convert('not xml'), {});
    });

    it('should parse the closed part of an unterminated document', async () => {

        assert.deepStrictEqual(await convert('<a><b>1</b>'), { a: { b: '1' } });
    });

    // GHSA-474x-hrwr-fgx4: fast-xml-parser <= 5.11.2 scans an unterminated stop node in quadratic
    // time (about 13 s for this input); 5.12.0 is linear.
    it('should not take quadratic time on an unterminated stop node', async function() {

        this.timeout(10000);
        const xml = '<r><s>' + '<s '.repeat(80000);
        const start = Date.now();
        await convert(xml, { stopNodes: 'r.s' }).catch(() => {});

        assert.ok(Date.now() - start < 3000, `took ${Date.now() - start} ms`);
    });
});
