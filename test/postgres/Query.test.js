const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const Module = require('module');
const { PassThrough } = require('stream');
const { createMockContext } = require('../utils');

const libPath = path.join(__dirname, '../../src/appmixer/postgres/lib.js');
const FakeQueryStream = class {
    constructor(text) {
        this.text = text;
    }
};

describe('postgres/lib disconnect behaviour', () => {

    let PoolConstructorStub;
    let fakePool;
    let lib;
    let stringifierStub;
    let originalModuleRequire;

    beforeEach(() => {
        PoolConstructorStub = sinon.stub();
        fakePool = {
            connect: sinon.stub(),
            end: sinon.stub()
        };
        PoolConstructorStub.callsFake(() => fakePool);
        stringifierStub = sinon.stub().callsFake(() => new PassThrough({ objectMode: true }));

        originalModuleRequire = Module.prototype.require;
        Module.prototype.require = function(request, ...args) {
            if (request === 'pg') {
                return { Pool: PoolConstructorStub };
            }
            if (request === 'pg-query-stream') {
                return FakeQueryStream;
            }
            if (request === 'csv-stringify') {
                return { stringify: stringifierStub };
            }
            return originalModuleRequire.call(this, request, ...args);
        };

        delete require.cache[libPath];

        lib = require(libPath);
    });

    afterEach(() => {
        delete require.cache[libPath];
        Module.prototype.require = originalModuleRequire;
        sinon.restore();
    });

    it('should keep disconnect pending when streaming query is active', async function() {
        this.timeout(5000);

        const client = {
            query: sinon.stub(),
            release: sinon.stub()
        };
        const dbStream = new PassThrough({ objectMode: true });
        client.query.returns(dbStream);
        fakePool.connect.resolves(client);

        let resolveEnd;
        fakePool.end.callsFake(() => new Promise(resolve => {
            resolveEnd = resolve;
        }));

        let resolveSave;
        const context = createMockContext({
            auth: {
                dbUser: 'user',
                dbHost: 'host',
                database: 'db',
                dbPassword: 'pass',
                dbPort: 5432
            },
            componentId: 'postgres-query',
            saveFileStream: sinon.stub().callsFake((filename, stream) => {
                return new Promise(resolve => {
                    resolveSave = resolve;
                });
            })
        });

        const streamPromise = lib.streamQueryToFile(context, 'result.csv', 'SELECT pg_sleep(20)');

        await new Promise(resolve => setImmediate(resolve));

        assert.strictEqual(fakePool.connect.calledOnce, true, 'Pool.connect should be called once');
        assert.strictEqual(client.query.calledOnce, true, 'client.query should be called once');
        assert.strictEqual(context.saveFileStream.calledOnce, true, 'saveFileStream should be invoked');

        const disconnectPromise = lib.disconnect(context);

        await new Promise(resolve => setImmediate(resolve));
        assert.strictEqual(fakePool.end.calledOnce, true, 'pool.end should be called once');
        assert.strictEqual(client.release.called, false, 'client.release should not be called while streaming');

        let outcome;

        try {
            outcome = await Promise.race([
                disconnectPromise.then(() => 'resolved'),
                new Promise(resolve => setTimeout(() => resolve('timeout'), 25))
            ]);

            assert.strictEqual(outcome, 'timeout', 'disconnect should remain pending while the query stream is active');
        } finally {
            dbStream.end();
            if (resolveSave) {
                resolveSave({ fileId: 'file-123' });
            }
            await streamPromise;

            if (resolveEnd) {
                resolveEnd();
            }

            await disconnectPromise;

            assert.strictEqual(
                client.release.calledOnce,
                true,
                'client.release should be called once the file stream completes'
            );

            assert.strictEqual(
                client.release.calledOnce,
                true,
                'client.release should be called once the file stream completes'
            );
        }
    });
});
