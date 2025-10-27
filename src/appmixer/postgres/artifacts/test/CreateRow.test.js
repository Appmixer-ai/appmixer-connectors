'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../test/utils');

const componentPath = path.join(__dirname, '../../db/CreateRow/CreateRow.js');
const libPath = path.join(__dirname, '../../lib.js');
const { Client } = require('pg');

describe('postgres/CreateRow', () => {

    let originalLibModule;
    let createRow;
    let libStub;

    beforeEach(() => {
        const libResolve = require.resolve(libPath);
        originalLibModule = require.cache[libResolve];

        libStub = {
            query: sinon.stub().resolves({ rows: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] }),
            disconnect: sinon.stub().resolves(),
            escapeIdentifier: new Client().escapeIdentifier
        };

        require.cache[libResolve] = {
            id: libResolve,
            filename: libResolve,
            loaded: true,
            exports: libStub
        };

        delete require.cache[require.resolve(componentPath)];
        createRow = require(componentPath);
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

    it('should escape column identifiers and parameterize values', async () => {
        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                row: {
                    content: {
                        name: 'John Doe',
                        email: 'john@example.com'
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await createRow.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected INSERT query to be executed once');
        const [callContext, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(callContext, context, 'Context should be forwarded to lib.query');

        assert.strictEqual(
            queryText.startsWith('INSERT INTO "public"."users"('),
            true,
            'Query should target escaped schema and table'
        );
        assert.strictEqual(queryText.includes('"name"'), true, 'Column name should be escaped');
        assert.strictEqual(queryText.includes('"email"'), true, 'Column email should be escaped');
        assert.strictEqual(queryText.includes('$1'), true, 'Query should use first parameter placeholder');
        assert.strictEqual(queryText.includes('$2'), true, 'Query should use second parameter placeholder');
        assert.deepStrictEqual(params, ['John Doe', 'john@example.com'], 'Values should be passed as parameters');

        assert.strictEqual(context.sendJson.calledOnce, true, 'Component should send result to newRow port');
        assert.deepStrictEqual(
            context.sendJson.firstCall.args,
            [{ id: 1, name: 'John Doe', email: 'john@example.com' }, 'newRow'],
            'Component should forward the inserted row'
        );
    });

    // column names are formed by Appmixer inspector - not actually needed to be tested here
    it('should escape malicious column names', async () => {
        libStub.query.resolves({ rows: [{}] });

        const context = createMockContext({
            properties: { table: 'users' },
            messages: {
                row: {
                    content: {
                        'name); DROP TABLE users; --': 'malicious'
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await createRow.receive(context);

        const [, queryText] = libStub.query.firstCall.args;
        assert.strictEqual(queryText.startsWith('INSERT INTO "public"."users"('), true, 'Default schema should be used when not provided');
        assert.strictEqual(
            queryText.includes('"name); DROP TABLE users; --"'),
            true,
            'Malicious column name should be escaped'
        );
    });
});
