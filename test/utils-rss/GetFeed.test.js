'use strict';

const assert = require('assert');
const http = require('http');
const path = require('path');
const { createMockContext } = require('../utils');

const GetFeed = require(path.join(__dirname, '../../src/appmixer/utils/rss/GetFeed/GetFeed.js'));

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toUTCString();
const BODY = 'x'.repeat(5000);

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
<title>Test feed</title><link>https://example.com</link><description>d</description>
<item><title>New 1</title><link>https://example.com/1</link><pubDate>${hoursAgo(1)}</pubDate>
<description>${BODY}</description><content:encoded><![CDATA[<p>${BODY}</p>]]></content:encoded></item>
<item><title>New 2</title><link>https://example.com/2</link><pubDate>${hoursAgo(5)}</pubDate>
<description>short</description></item>
<item><title>Old</title><link>https://example.com/3</link><pubDate>${hoursAgo(72)}</pubDate>
<description>old</description></item>
<item><title>No date</title><link>https://example.com/4</link><description>nodate</description></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title>
<entry><title>Entry</title><link href="https://example.com/a"/><updated>${new Date().toISOString()}</updated>
<summary type="html">&lt;p&gt;Atom summary text&lt;/p&gt;</summary></entry>
</feed>`;

describe('utils.rss.GetFeed', function() {

    let server;
    let baseUrl;
    let context;

    before(function(done) {
        server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/xml');
            res.end(req.url === '/atom' ? ATOM : RSS);
        }).listen(0, () => {
            baseUrl = `http://127.0.0.1:${server.address().port}`;
            done();
        });
    });

    after(function(done) {
        server.close(done);
    });

    beforeEach(function() {
        context = createMockContext();
        context.CancelError = class CancelError extends Error {};
    });

    const run = async (input) => {
        context.messages = { in: { content: input } };
        await GetFeed.receive(context);
        assert.strictEqual(context.sendJson.callCount, 1);
        return context.sendJson.firstCall.args[0].feed;
    };

    it('returns every item with full content when no option is set (unchanged behavior)', async function() {
        const feed = await run({ url: `${baseUrl}/rss` });
        assert.strictEqual(feed.title, 'Test feed');
        assert.strictEqual(feed.items.length, 4);
        assert.ok(feed.items[0]['content:encoded'].length > 5000);
    });

    it('keeps only items within Max Age and drops undated ones', async function() {
        const feed = await run({ url: `${baseUrl}/rss`, maxAgeHours: 24 });
        assert.deepStrictEqual(feed.items.map(i => i.title), ['New 1', 'New 2']);
    });

    it('applies Max Items after the age filter', async function() {
        const feed = await run({ url: `${baseUrl}/rss`, maxAgeHours: 24, maxItems: 1 });
        assert.deepStrictEqual(feed.items.map(i => i.title), ['New 1']);
    });

    it('drops full content and shortens the snippet when Include Full Content is off', async function() {
        const feed = await run({ url: `${baseUrl}/rss`, includeContent: false });
        const item = feed.items[0];
        assert.strictEqual(item.content, undefined);
        assert.strictEqual(item['content:encoded'], undefined);
        assert.strictEqual(item.contentSnippet.length, 501);
        assert.strictEqual(item.link, 'https://example.com/1');
    });

    it('keeps the Atom summary as a plain-text snippet when content is dropped', async function() {
        const feed = await run({ url: `${baseUrl}/atom`, includeContent: false });
        assert.strictEqual(feed.items[0].summary, undefined);
        assert.strictEqual(feed.items[0].contentSnippet, 'Atom summary text');
    });

    it('rejects a non-positive Max Age', async function() {
        context.messages = { in: { content: { url: `${baseUrl}/rss`, maxAgeHours: -1 } } };
        await assert.rejects(() => GetFeed.receive(context), context.CancelError);
    });
});
