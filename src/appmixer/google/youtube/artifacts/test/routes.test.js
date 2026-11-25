const assert = require('assert');
const sinon = require('sinon');
const routes = require('../../routes');

// The YouTube PubSubHubbub notification is an Atom feed parsed with fast-xml-parser.
describe('google.youtube routes', () => {

    const FEED = `<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <link rel="hub" href="https://pubsubhubbub.appspot.com"/>
  <link rel="self" href="https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC123"/>
  <title>YouTube video feed</title>
  <updated>2026-11-12T10:00:00.123+00:00</updated>
  <entry>
    <id>yt:video:0012345abcd</id>
    <yt:videoId>0012345abcd</yt:videoId>
    <yt:channelId>UC123</yt:channelId>
    <title>Tom &amp; Jerry &lt;3 007</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=0012345abcd"/>
    <author>
      <name>Chan &quot;X&quot;</name>
      <uri>https://www.youtube.com/channel/UC123</uri>
    </author>
    <published>2026-11-12T09:59:00+00:00</published>
    <updated>2026-11-12T10:00:00.123+00:00</updated>
  </entry>
</feed>`;

    let registered;
    let context;
    let h;

    function route(method) {

        return registered.find(r => r.method === method);
    }

    beforeEach(() => {

        registered = [];
        context = {
            http: { router: { register: r => registered.push(r) } },
            triggerComponent: sinon.stub().resolves({ statusCode: 200, body: {} })
        };
        h = {
            response: sinon.stub().callsFake(body => {
                const response = { body, headers: {} };
                response.code = sinon.stub().callsFake(code => { response.statusCode = code; return response; });
                response.type = sinon.stub().callsFake(type => { response.contentType = type; return response; });
                return response;
            })
        };
        routes(context);
    });

    it('should register the notification and the verification route', () => {

        assert.deepStrictEqual(registered.map(r => `${r.method} ${r.path}`), [
            'POST /trigger/{flowId}/component/{componentId}',
            'GET /trigger/{flowId}/component/{componentId}'
        ]);
    });

    it('should parse the Atom notification and trigger the component', async () => {

        const response = await route('POST').options.handler({
            payload: Buffer.from(FEED, 'utf8'),
            params: { flowId: 'flow-1', componentId: 'comp-1' }
        }, h);

        assert(context.triggerComponent.calledOnce, 'triggerComponent should be called once');
        assert.deepStrictEqual(context.triggerComponent.getCall(0).args, ['flow-1', 'comp-1', {
            // The id keeps its leading zeros: tag values that are not plain numbers stay strings.
            videoId: '0012345abcd',
            title: 'Tom & Jerry <3 007',
            description: undefined,
            publishDate: '2026-11-12T09:59:00+00:00',
            updatedDate: '2026-11-12T10:00:00.123+00:00',
            channelId: 'UC123',
            channelTitle: 'Chan "X"',
            channelUrl: 'https://www.youtube.com/channel/UC123',
            videoUrl: 'https://www.youtube.com/watch?v=0012345abcd'
        }, {}, {}]);
        assert.strictEqual(response.statusCode, 200);
    });

    it('should pass on the status code and headers of the component response', async () => {

        context.triggerComponent.resolves({ statusCode: 202, body: { ok: true }, headers: { 'x-test': '1' } });

        const response = await route('POST').options.handler({
            payload: Buffer.from(FEED, 'utf8'),
            params: { flowId: 'flow-1', componentId: 'comp-1' }
        }, h);

        assert.deepStrictEqual(response.body, { ok: true });
        assert.strictEqual(response.statusCode, 202);
        assert.deepStrictEqual(response.headers, { 'x-test': '1' });
    });

    it('should answer the hub verification challenge', async () => {

        const response = await route('GET').options.handler({ query: { 'hub.challenge': 'abc123' } }, h);

        assert.strictEqual(response.body, 'abc123');
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(response.contentType, 'text/plain');
    });
});
