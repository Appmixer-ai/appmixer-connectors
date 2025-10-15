'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../test/utils');

const componentPath = path.join(__dirname, '../../db/ListColumns/ListColumns.js');
const libPath = path.join(__dirname, '../../lib.js');

describe('postgres/ListColumns', () => {

    let originalLibModule;
    let listColumns;
    let libStub;

    beforeEach(() => {
        const libResolve = require.resolve(libPath);
        originalLibModule = require.cache[libResolve];

        libStub = {
            query: sinon.stub().resolves({ rows: [] }),
            disconnect: sinon.stub().resolves()
        };

        require.cache[libResolve] = {
            id: libResolve,
            filename: libResolve,
            loaded: true,
            exports: libStub
        };

        delete require.cache[require.resolve(componentPath)];
        listColumns = require(componentPath);
    });

    afterEach(() => {
        const libResolve = require.resolve(libPath);
        delete require.cache[libResolve];
        if (originalLibModule) {
            require.cache[libResolve] = originalLibModule;
        }
        delete require.cache[require.resolve(componentPath)];
        sinon.restore();
    });

    it('should parameterize table lookup to prevent SQL injection', async () => {
        const maliciousTable = "a'; drop table foo; --";
        const context = createMockContext({
            properties: { table: maliciousTable },
            sendJson: sinon.stub()
        });

        await listColumns.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected query to be executed once');
        const [callContext, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(callContext, context, 'Context object should be forwarded to lib.query');
        assert.strictEqual(
            queryText,
            'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = $1 and table_name = $2',
            'Unexpected SQL query text'
        );
        assert.deepStrictEqual(params, ['public', maliciousTable], 'Query parameters should contain schema and table values');
        assert.strictEqual(
            queryText.toLowerCase().includes('drop table'),
            false,
            'Query text must not contain injected SQL'
        );
    });

    it('should handle schema.table format correctly', async () => {
        const context = createMockContext({
            properties: { table: 'myschema.mytable' },
            sendJson: sinon.stub()
        });

        await listColumns.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected query to be executed once');
        const [callContext, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(callContext, context, 'Context object should be forwarded to lib.query');
        assert.strictEqual(
            queryText,
            'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = $1 and table_name = $2',
            'Unexpected SQL query text'
        );
        assert.deepStrictEqual(params, ['myschema', 'mytable'], 'Query parameters should contain schema and table values');
    });

});
