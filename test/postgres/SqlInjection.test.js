const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const Module = require('module');
const { createMockContext } = require('../utils');

const libPath = path.join(__dirname, '../../src/appmixer/postgres/lib.js');

describe('postgres SQL injection protection', () => {

    let PoolConstructorStub;
    let fakePool;
    let lib;
    let originalModuleRequire;
    let ListColumns;
    let UpdateRow;
    let DeleteRow;
    let CreateRow;
    let actualPg;

    before(() => {
        // Load actual pg module to get Client class for escaping
        actualPg = require(path.join(__dirname, '../../src/appmixer/postgres/node_modules/pg'));
    });

    beforeEach(() => {
        PoolConstructorStub = sinon.stub();
        fakePool = {
            connect: sinon.stub(),
            end: sinon.stub(),
            query: sinon.stub()
        };
        PoolConstructorStub.callsFake(() => fakePool);

        originalModuleRequire = Module.prototype.require;
        Module.prototype.require = function(request, ...args) {
            if (request === 'pg') {
                return { Pool: PoolConstructorStub, Client: actualPg.Client };
            }
            if (request === 'csv-stringify') {
                return { stringify: sinon.stub() };
            }
            if (request === 'pg-query-stream') {
                return class FakeQueryStream {};
            }
            return originalModuleRequire.call(this, request, ...args);
        };

        delete require.cache[libPath];
        delete require.cache[path.join(__dirname, '../../src/appmixer/postgres/db/ListColumns/ListColumns.js')];
        delete require.cache[path.join(__dirname, '../../src/appmixer/postgres/db/UpdateRow/UpdateRow.js')];
        delete require.cache[path.join(__dirname, '../../src/appmixer/postgres/db/DeleteRow/DeleteRow.js')];
        delete require.cache[path.join(__dirname, '../../src/appmixer/postgres/db/CreateRow/CreateRow.js')];

        lib = require(libPath);
        ListColumns = require(path.join(__dirname, '../../src/appmixer/postgres/db/ListColumns/ListColumns.js'));
        UpdateRow = require(path.join(__dirname, '../../src/appmixer/postgres/db/UpdateRow/UpdateRow.js'));
        DeleteRow = require(path.join(__dirname, '../../src/appmixer/postgres/db/DeleteRow/DeleteRow.js'));
        CreateRow = require(path.join(__dirname, '../../src/appmixer/postgres/db/CreateRow/CreateRow.js'));
    });

    afterEach(() => {
        delete require.cache[libPath];
        Module.prototype.require = originalModuleRequire;
        sinon.restore();
    });

    describe('lib.escapeIdentifier', () => {
        it('should escape identifiers with double quotes', () => {
            const result = lib.escapeIdentifier('test_table');
            assert.strictEqual(result, '"test_table"');
        });

        it('should escape double quotes in identifiers', () => {
            const result = lib.escapeIdentifier('test"table');
            assert.strictEqual(result, '"test""table"');
        });

        it('should escape malicious identifier attempts', () => {
            const result = lib.escapeIdentifier('users"; DROP TABLE users; --');
            assert.strictEqual(result, '"users""; DROP TABLE users; --"');
        });
    });

    describe('lib.escapeLiteral', () => {
        it('should escape literals with single quotes', () => {
            const result = lib.escapeLiteral('test value');
            assert.strictEqual(result, "'test value'");
        });

        it('should escape single quotes in literals', () => {
            const result = lib.escapeLiteral("test' OR '1'='1");
            assert.strictEqual(result, "'test'' OR ''1''=''1'");
        });
    });

    describe('ListColumns - SQL injection protection', () => {
        it('should use parameterized query for schema and table names', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'listcolumns-1',
                properties: {
                    table: 'public.users'
                }
            });

            fakePool.query.resolves({ rows: [] });

            await ListColumns.receive(context);

            assert.strictEqual(fakePool.query.calledOnce, true, 'query should be called once');
            const [query, values] = fakePool.query.firstCall.args;
            assert.strictEqual(query, 'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = $1 and table_name = $2');
            assert.deepStrictEqual(values, ['public', 'users']);
        });

        it('should protect against SQL injection in table name', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'listcolumns-2',
                properties: {
                    table: "public.users'; DROP TABLE users; --"
                }
            });

            fakePool.query.resolves({ rows: [] });

            await ListColumns.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // The malicious input should be passed as a parameter value, not interpolated
            assert.strictEqual(query, 'SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = $1 and table_name = $2');
            assert.deepStrictEqual(values, ['public', "users'; DROP TABLE users; --"]);
        });
    });

    describe('CreateRow - SQL injection protection', () => {
        it('should escape column identifiers', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'createrow-1',
                properties: {
                    table: 'public.users'
                },
                messages: {
                    row: {
                        content: {
                            name: 'John Doe',
                            email: 'john@example.com'
                        }
                    }
                }
            });

            fakePool.query.resolves({ rows: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] });

            await CreateRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // Should use escaped identifiers and parameterized values
            assert(query.includes('"name"'), 'Column name should be escaped');
            assert(query.includes('"email"'), 'Column email should be escaped');
            assert(query.includes('$1'), 'Should use parameterized value $1');
            assert(query.includes('$2'), 'Should use parameterized value $2');
            assert.deepStrictEqual(values, ['John Doe', 'john@example.com']);
        });

        it('should protect against SQL injection in column names', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'createrow-2',
                properties: {
                    table: 'public.users'
                },
                messages: {
                    row: {
                        content: {
                            'name"; DROP TABLE users; --': 'malicious'
                        }
                    }
                }
            });

            fakePool.query.resolves({ rows: [{}] });

            await CreateRow.receive(context);

            const [query] = fakePool.query.firstCall.args;
            // The malicious column name should be escaped with double quotes
            assert(query.includes('"name""; DROP TABLE users; --"'), 'Malicious column name should be escaped');
        });
    });

    describe('UpdateRow - SQL injection protection', () => {
        it('should use parameterized queries for WHERE clause values', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'updaterow-1',
                properties: {
                    table: 'public.users'
                },
                messages: {
                    row: {
                        content: {
                            name: 'Updated Name',
                            filter: {
                                AND: [
                                    {
                                        OR: [
                                            { column: 'id', operator: '=', value: '1' }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            });

            fakePool.query.resolves({ rowCount: 1 });

            await UpdateRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // Should use parameterized values for both SET and WHERE
            assert(query.includes('$1'), 'Should have parameter for SET value');
            assert(query.includes('$2'), 'Should have parameter for WHERE value');
            assert.deepStrictEqual(values, ['Updated Name', '1']);
        });

        it('should protect against SQL injection in LIKE operators', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'updaterow-2',
                properties: {
                    table: 'public.users'
                },
                messages: {
                    row: {
                        content: {
                            status: 'active',
                            filter: {
                                AND: [
                                    {
                                        OR: [
                                            { column: 'name', operator: 'CONTAINS', value: "'; DROP TABLE users; --" }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            });

            fakePool.query.resolves({ rowCount: 1 });

            await UpdateRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // The malicious value should be parameterized, not interpolated
            assert(query.includes('LIKE $2'), 'Should use parameterized LIKE');
            assert.strictEqual(values[1], "%'; DROP TABLE users; --%", 'Malicious value should be passed as parameter');
        });

        it('should protect against SQL injection in IN operator', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'updaterow-3',
                properties: {
                    table: 'public.users'
                },
                messages: {
                    row: {
                        content: {
                            status: 'blocked',
                            filter: {
                                AND: [
                                    {
                                        OR: [
                                            { column: 'id', operator: 'IN', value: '1,2,3); DROP TABLE users; --' }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            });

            fakePool.query.resolves({ rowCount: 1 });

            await UpdateRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // Should use multiple parameters for IN clause
            assert(query.includes('IN ($2,$3,$4)'), 'Should use parameterized IN clause');
            // The malicious value should be split and passed as parameters
            assert(values.includes('1'), 'Should include value 1');
            assert(values.includes('2'), 'Should include value 2');
            assert(values.includes('3); DROP TABLE users; --'), 'Malicious value should be passed as parameter');
        });
    });

    describe('DeleteRow - SQL injection protection', () => {
        it('should use parameterized queries for WHERE clause', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'deleterow-1',
                properties: {
                    table: 'public.users'
                },
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
                }
            });

            fakePool.query.resolves({ rowCount: 1 });

            await DeleteRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            assert(query.includes('$1'), 'Should use parameterized WHERE clause');
            assert.deepStrictEqual(values, ['deleted']);
        });

        it('should protect against SQL injection in DELETE WHERE clause', async () => {
            const context = createMockContext({
                auth: {
                    dbUser: 'user',
                    dbHost: 'host',
                    database: 'db',
                    dbPassword: 'pass',
                    dbPort: 5432
                },
                componentId: 'deleterow-2',
                properties: {
                    table: 'public.users'
                },
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
                }
            });

            fakePool.query.resolves({ rowCount: 999 });

            await DeleteRow.receive(context);

            const [query, values] = fakePool.query.firstCall.args;
            // The malicious value should be parameterized
            assert(query.includes('$1'), 'Should use parameterized value');
            assert.deepStrictEqual(values, ["' OR '1'='1"], 'Malicious value should be passed as parameter');
        });
    });
});
