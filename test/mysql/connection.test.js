'use strict';

const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
// The same mysql2 module instance common.js loads (the connector's own dependency).
const mysql = require(require.resolve('mysql2', { paths: [path.join(__dirname, '../../src/appmixer/mysql')] }));
const { buildConnectionOptions, connect, createConnection, validateQuery } = require('../../src/appmixer/mysql/common');

const BASE_AUTH = {
    dbUser: 'appmixer',
    dbHost: 'db.example.com',
    database: 'shop',
    dbPassword: 'secret'
};

describe('MySQL connection options', () => {

    it('builds the options without SSL for accounts without SSL fields', () => {

        const opt = buildConnectionOptions(BASE_AUTH);
        assert.deepStrictEqual(opt, {
            user: 'appmixer',
            host: 'db.example.com',
            database: 'shop',
            password: 'secret',
            port: 3306,
            dateStrings: true,
            supportBigNumbers: true,
            jsonStrings: true,
            decimalNumbers: true
        });
        assert.strictEqual(opt.ssl, undefined);
    });

    it('uses the port from the account as a number', () => {

        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, dbPort: '3307' }).port, 3307);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, dbPort: ' 3308 ' }).port, 3308);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, dbPort: 3309 }).port, 3309);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, dbPort: '' }).port, 3306);
    });

    it('rejects a port that is not a number', () => {

        assert.throws(() => buildConnectionOptions({ ...BASE_AUTH, dbPort: '33a6' }), /Invalid database port/);
    });

    it('does not use SSL when Use SSL is off', () => {

        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, useSsl: 'false' }).ssl, undefined);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, useSsl: false }).ssl, undefined);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, useSsl: '' }).ssl, undefined);
        assert.strictEqual(buildConnectionOptions({ ...BASE_AUTH, sslCa: '   ' }).ssl, undefined);
    });

    it('encrypts without certificate verification when Use SSL is on and no CA is given', () => {

        const expected = { rejectUnauthorized: false };
        assert.deepStrictEqual(buildConnectionOptions({ ...BASE_AUTH, useSsl: 'true' }).ssl, expected);
        assert.deepStrictEqual(buildConnectionOptions({ ...BASE_AUTH, useSsl: true }).ssl, expected);
    });

    it('verifies the server certificate when a CA certificate is given', () => {

        const ca = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----';
        assert.deepStrictEqual(
            buildConnectionOptions({ ...BASE_AUTH, useSsl: 'true', sslCa: '\n' + ca + '\n' }).ssl,
            { ca, rejectUnauthorized: true }
        );
        // A CA certificate alone turns SSL on.
        assert.deepStrictEqual(
            buildConnectionOptions({ ...BASE_AUTH, sslCa: ca }).ssl,
            { ca, rejectUnauthorized: true }
        );
    });
});

describe('MySQL connect', () => {

    afterEach(() => sinon.restore());

    function fakeConnection(connectError) {
        return {
            connect: sinon.stub().callsFake(cb => cb(connectError || null)),
            destroy: sinon.stub(),
            end: sinon.stub()
        };
    }

    it('connects with the shared options (auth.js passes the account fields directly)', async () => {

        const conn = fakeConnection();
        const stub = sinon.stub(mysql, 'createConnection').returns(conn);

        const result = await connect({ ...BASE_AUTH, useSsl: 'true' });

        assert.strictEqual(result, conn);
        sinon.assert.calledOnce(stub);
        assert.deepStrictEqual(stub.firstCall.args[0], buildConnectionOptions({ ...BASE_AUTH, useSsl: 'true' }));
    });

    it('components connect with context.auth', async () => {

        const conn = fakeConnection();
        const stub = sinon.stub(mysql, 'createConnection').returns(conn);

        await createConnection({ auth: { ...BASE_AUTH, dbPort: '3310' } });

        assert.strictEqual(stub.firstCall.args[0].port, 3310);
        assert.strictEqual(stub.firstCall.args[0].dateStrings, true);
    });

    it('rejects and destroys the connection when connecting fails', async () => {

        const error = new Error('ER_ACCESS_DENIED_ERROR');
        const conn = fakeConnection(error);
        sinon.stub(mysql, 'createConnection').returns(conn);

        await assert.rejects(connect(BASE_AUTH), /ER_ACCESS_DENIED_ERROR/);
        sinon.assert.calledOnce(conn.destroy);
    });
});

describe('MySQL validateQuery', () => {

    it('allows SELECT and WITH queries', () => {

        assert.doesNotThrow(() => validateQuery('SELECT * FROM users'));
        assert.doesNotThrow(() => validateQuery('with cte as (select 1) select * from cte'));
    });

    it('rejects other statements', () => {

        assert.throws(() => validateQuery('DELETE FROM users'), /Only SELECT or WITH queries are allowed/);
    });
});
