'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const { createMockContext } = require('../../../../../test/utils');

const componentPath = path.join(__dirname, '../../db/UpdateRow/UpdateRow.js');
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

describe('postgres/UpdateRow', () => {

    let originalLibModule;
    let updateRow;
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
        updateRow = require(componentPath);
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

    it('should parameterize filter values to prevent SQL injection', async () => {
        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                row: {
                    content: {
                        name: 'Alice',
                        status: 'active',
                        filter: {
                            AND: [{
                                OR: [{
                                    column: 'id',
                                    operator: '=',
                                    value: '1'
                                }]
                            }]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await updateRow.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected UPDATE query to be invoked');
        const [callContext, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(callContext, context, 'Context object should be forwarded to lib.query');

        assert.strictEqual(queryText.startsWith('UPDATE "public"."users" SET'), true, 'Table should be escaped');
        assert.strictEqual(queryText.includes('"name" = $1'), true, 'SET clause should use placeholders');
        assert.strictEqual(queryText.includes('"status" = $2'), true, 'SET clause should escape column names');
        assert.strictEqual(queryText.includes('"id" = $3'), true, 'WHERE clause should be parameterized');
        assert.deepStrictEqual(params, ['Alice', 'active', '1'], 'All values should be passed as parameters');
        assert.deepStrictEqual(
            context.sendJson.firstCall.args,
            [{ rowCount: 1 }, 'out'],
            'Component should forward the affected row count'
        );
    });

    it('should protect against SQL injection in LIKE operators', async () => {
        const maliciousValue = "a'; DROP TABLE foo; --";
        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                row: {
                    content: {
                        name: 'Alice',
                        filter: {
                            AND: [{
                                OR: [{
                                    column: 'name',
                                    operator: 'CONTAINS',
                                    value: maliciousValue
                                }]
                            }]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await updateRow.receive(context);

        assert.strictEqual(libStub.query.calledOnce, true, 'Expected UPDATE query to be invoked');
        const [, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(queryText.includes('LIKE $2'), true, 'LIKE operator should use parameter placeholder');
        assert.deepStrictEqual(params, ['Alice', `%${maliciousValue}%`], 'Malicious value should be parameterized');
    });

    it('should protect against SQL injection in IN operator', async () => {
        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                row: {
                    content: {
                        status: 'blocked',
                        filter: {
                            AND: [{
                                OR: [{
                                    column: 'id',
                                    operator: 'IN',
                                    value: '1,2,3); DROP TABLE users; --'
                                }]
                            }]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await updateRow.receive(context);

        const [, queryText, params] = libStub.query.firstCall.args;
        assert.strictEqual(queryText.includes('IN ($2,$3,$4)'), true, 'IN operator should use multiple placeholders');
        assert.deepStrictEqual(
            params,
            ['blocked', '1', '2', '3); DROP TABLE users; --'],
            'IN values should be split and parameterized'
        );
    });

    it('should reject malicious operators attempting SQL injection', async () => {
        const maliciousOperator = "= '1'); DROP TABLE users; --";

        const context = createMockContext({
            properties: { table: 'public.users' },
            messages: {
                row: {
                    content: {
                        status: 'active',
                        filter: {
                            AND: [{
                                OR: [{
                                    column: 'id',
                                    operator: maliciousOperator,
                                    value: '1'
                                }]
                            }]
                        }
                    }
                }
            },
            sendJson: sinon.stub()
        });

        await assert.rejects(
            () => updateRow.receive(context),
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
