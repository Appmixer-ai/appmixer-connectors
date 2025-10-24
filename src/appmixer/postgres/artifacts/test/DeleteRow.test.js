'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../test/utils');

const componentPath = path.join(__dirname, '../../db/DeleteRow/DeleteRow.js');
const libPath = path.join(__dirname, '../../lib.js');

const SAFE_OPERATORS = new Set([
    '=', '!=', '<>', '<', '<=', '>', '>=',
    'CONTAINS', 'NOT CONTAINS', 'STARTS WITH', 'NOT STARTS WITH',
    'ENDS WITH', 'NOT ENDS WITH', 'IN', 'NOT IN',
    'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL'
]);

function sanitizeOperatorStub(operator, context) {
    const trimmedOperator = (operator ?? '').trim();
    const normalizedOperator = trimmedOperator.toUpperCase();

    if (!SAFE_OPERATORS.has(normalizedOperator)) {
        throw new context.CancelError(`Unsupported operator "${operator}"`);
    }

    return normalizedOperator;
}

function escapeIdentifierStub(identifier) {
    const safeIdentifier = identifier.replace(/"/g, '""');
    return `"${safeIdentifier}"`;
}

describe('postgres/DeleteRow', () => {

    let originalLibModule;
    let deleteRow;
    let libStub;

    beforeEach(() => {
        const libResolve = require.resolve(libPath);
        originalLibModule = require.cache[libResolve];

        libStub = {
            query: sinon.stub().resolves({ rowCount: 1 }),
            disconnect: sinon.stub().resolves(),
            escapeIdentifier: escapeIdentifierStub,
            sanitizeOperator: sanitizeOperatorStub
        };

        require.cache[libResolve] = {
            id: libResolve,
            filename: libResolve,
            loaded: true,
            exports: libStub
        };

        delete require.cache[require.resolve(componentPath)];
        deleteRow = require(componentPath);
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

    it('should parameterize filter values in DELETE queries', async () => {
        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                in: {
                    content: {
                        filter: {
                            AND: [
                                {
                                    OR: [
                                        { column: 'status', operator: '=', value: 'deleted' }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await deleteRow.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected DELETE query to be executed once');
        const [callContext, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(callContext, context, 'Context should be forwarded to lib.query');
        assert.strictEqual(queryText.startsWith('DELETE FROM "public"."users"'), true, 'Query should target escaped table');
        assert.strictEqual(queryText.includes('"status" = $1'), true, 'Column should be escaped and parameterized');
        assert.deepStrictEqual(params, ['deleted'], 'Filter values should be passed as parameters');
        assert.deepStrictEqual(
            context.sendJson.firstCall.args,
            [{ rowCount: 1 }, 'out'],
            'Component should forward affected row count'
        );
    });

    it('should protect against SQL injection in filter values', async () => {
        libStub.query.resolves({ rowCount: 999 });

        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                in: {
                    content: {
                        filter: {
                            AND: [
                                {
                                    OR: [
                                        { column: 'name', operator: '=', value: "' OR '1'='1" }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await deleteRow.receive(context);

        const [, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(queryText.includes('"name" = $1'), true, 'Malicious value should use parameter placeholder');
        assert.deepStrictEqual(params, ["' OR '1'='1"], 'Malicious input should be passed as parameter');
    });

    it('should reject malicious operators attempting SQL injection', async () => {
        const maliciousOperator = "= '1'); drop table foo; --";

        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                in: {
                    content: {
                        filter: {
                            AND: [
                                {
                                    OR: [
                                        { column: 'id', operator: maliciousOperator, value: '1' }
                                    ]
                                }
                            ]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await assert.rejects(
            () => deleteRow.receive(context),
            (error) => {
                assert(error instanceof context.CancelError, 'Error should be CancelError');
                assert.strictEqual(error.message, `Unsupported operator "${maliciousOperator}"`);
                return true;
            }
        );

        assert.strictEqual(libStub.query.called, false, 'Query should not be executed for malicious operators');
        assert.strictEqual(context.sendJson.called, false, 'No output should be sent when operator is invalid');
    });
});
