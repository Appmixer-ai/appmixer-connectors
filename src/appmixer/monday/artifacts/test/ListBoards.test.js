'use strict';

const assert = require('assert');
const sinon = require('sinon');
const { createMockContext, createMutexLock } = require('../../../../../test/utils.js');

describe('monday core ListBoards', function() {

    let ListBoards;
    let fetchStub;

    beforeEach(() => {
        // stub the PagingAggregator instance used by the module
        fetchStub = sinon.stub().resolves([{ id: 'b1', name: 'Board 1' }]);

        // Create a shim file node_modules/appmixer-lib/intex.js so tests/CI that
        // expect this file can require it. We write it into the repo's node_modules
        // folder at runtime before requiring the component.
        const fs = require('fs');
        const path = require('path');
        const shimDir = path.resolve(__dirname, '../../node_modules/appmixer-lib');
        const shimPath = path.join(shimDir, 'index.js');

        if (!fs.existsSync(shimDir)) {
            fs.mkdirSync(shimDir, { recursive: true });
        }

        const shimContent = `'use strict';

module.exports = {
    util: {
        PagingAggregator: function(fetcher, accumulatorFn, doneFn) {
            return {
                fetch: async function(args, page, pageSize) {
                    const chunk = await fetcher(args, page, pageSize);
                    if (accumulatorFn) {
                        return accumulatorFn([], chunk);
                    }
                    return chunk && chunk.boards ? chunk.boards : [];
                }
            };
        }
    }
};`;

        fs.writeFileSync(shimPath, shimContent, 'utf8');

        // Require the shim directly and stub its PagingAggregator
        const appmixerLibUtil = require(shimPath).util;

        // Stub the PagingAggregator constructor to return our fetchStub
        sinon.stub(appmixerLibUtil, 'PagingAggregator').callsFake(function() {
            return { fetch: fetchStub };
        });

        // Ensure module is reloaded so it picks up our stubbed PagingAggregator
        const modulePath = require.resolve('../../core/ListBoards/ListBoards.js');
        delete require.cache[modulePath];
        ListBoards = require('../../core/ListBoards/ListBoards.js');
    });

    afterEach(() => {
        // cleanup shim and restore sinon
        try {
            const fs = require('fs');
            const path = require('path');
            const shimPath = path.resolve(__dirname, '../../node_modules/appmixer-lib/intex.js');
            if (fs.existsSync(shimPath)) {
                fs.unlinkSync(shimPath);
            }
        } catch (e) {
            // ignore
        }
        sinon.restore();
    });

    it('calls receive 10 times in parallel with same apiKey and staticCache.get delayed, aggregator.fetch should be called once', async () => {

        // Prepare a context mock using shared project test utils
        const apiKey = 'test-api-key-123';

        // We'll override staticCache on the context created by createMockContext
        let cacheSetValue = null;

        const slowStaticCache = {
            get: sinon.stub().callsFake(async (key) => {
                // simulate a slow DB call taking between 10 and 50 ms
                const delay = 10 + Math.floor(Math.random() * 10);
                await new Promise(resolve => setTimeout(resolve, delay));
                return cacheSetValue; // initially null -> triggers fetch
            }),
            set: sinon.stub().callsFake(async (key, value) => {
                // setting the cache also takes some time
                await new Promise(resolve => setTimeout(resolve, 50));
                cacheSetValue = value;
                return true;
            })
        };

        const baseContext = createMockContext({
            auth: { apiKey },
            staticCache: slowStaticCache,
            config: {},
            sendJson: sinon.stub().resolves(),
            // opt into real mutex behaviour for this concurrency test
            lock: createMutexLock()
        });

        // Create 10 parallel calls using shallow clones of context
        const calls = Array.from({ length: 10 }, () => {
            // shallow copy to simulate distinct context objects but same staticCache
            return Object.assign({}, baseContext);
        });

        // Kick off 10 parallel receive invocations
        const promises = calls.map(ctx => ListBoards.receive(ctx));

        // Wait for all to finish
        await Promise.all(promises);

        assert.strictEqual(fetchStub.callCount, 1, 'aggregator.fetch should be called only once');
        assert.strictEqual(slowStaticCache.set.callCount, 1, 'staticCache.set should be called to populate cache');
        assert.strictEqual(slowStaticCache.get.callCount, 10, 'staticCache.get should be called for each receive call');
    });
});
