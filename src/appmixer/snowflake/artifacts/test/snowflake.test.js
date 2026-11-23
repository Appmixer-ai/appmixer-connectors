'use strict';

const assert = require('assert');
const crypto = require('crypto');
const { Readable } = require('stream');
const sdk = require('snowflake-sdk');
const realCreateConnection = sdk.createConnection;

const common = require('../../common');
const { SnowflakeDB, identifier, bindValue, connectionOptions, pairUpdates } = common;
const Query = require('../../db/Query/Query');
const AddRow = require('../../db/AddRow/AddRow');
const UpdatedRow = require('../../db/UpdatedRow/UpdatedRow');
const ListTables = require('../../db/ListTables/ListTables');
const auth = require('../../auth');

class CancelError extends Error {}

// Fake driver: records every statement and every destroy() call.
function installFakeDriver({ rows = [], error = null, connectError = null } = {}) {

    const log = { statements: [], destroyed: 0, options: null };
    sdk.createConnection = options => {
        log.options = options;
        let up = false;
        return {
            connect: cb => {
                up = !connectError;
                cb(connectError);
            },
            isUp: () => up,
            destroy: cb => {
                up = false;
                log.destroyed++;
                cb();
            },
            execute: ({ sqlText, binds, streamResult, complete }) => {
                log.statements.push({ sqlText, binds });
                if (error) return complete(error);
                if (streamResult) {
                    return complete(null, { streamRows: () => Readable.from(rows.map(r => ({ ...r }))) });
                }
                complete(null, {}, rows.map(r => ({ ...r })));
            }
        };
    };
    return log;
}

function contextFor(content, properties = {}) {

    const sent = [];
    return {
        sent,
        auth: { account: 'acc', username: 'u', password: 'p', database: 'DB', warehouse: 'WH' },
        messages: { in: { content } },
        properties,
        componentId: '1234-abcd',
        CancelError,
        sendJson: async (data, port) => sent.push({ data, port }),
        saveFileStream: async (name, stream) => {
            let body = '';
            for await (const chunk of stream) body += chunk;
            sent.push({ file: name, body });
            return { fileId: 'file-1' };
        }
    };
}

describe('snowflake common', () => {

    it('keeps simple identifiers and quotes the rest', () => {

        assert.strictEqual(identifier('USERS'), 'USERS');
        assert.strictEqual(identifier('my_table$1'), 'my_table$1');
        assert.strictEqual(identifier('My Table'), '"My Table"');
        assert.strictEqual(identifier('x"; DROP TABLE T; --'), '"x""; DROP TABLE T; --"');
        assert.throws(() => identifier('', 'Table'), /Table is required/);
    });

    it('turns objects into JSON bind values and undefined into null', () => {

        assert.strictEqual(bindValue(undefined), null);
        assert.strictEqual(bindValue({ a: 1 }), '{"a":1}');
        assert.strictEqual(bindValue('x'), 'x');
        assert.strictEqual(bindValue(3), 3);
    });

    it('uses the password, or key-pair authentication when a private key is set', () => {

        const base = { account: 'a', username: 'u', database: 'd', warehouse: 'w' };
        assert.deepStrictEqual(connectionOptions({ ...base, password: 'tok' }), { ...base, password: 'tok' });
        const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
        const plain = privateKey.export({ type: 'pkcs8', format: 'pem' });
        const encrypted = privateKey.export({ type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: 'pp' });
        const pkcs1 = privateKey.export({ type: 'pkcs1', format: 'pem' });
        for (const [key, passphrase] of [[plain], [encrypted, 'pp'], [pkcs1]]) {
            const jwt = connectionOptions({ ...base, password: 'ignored', privateKey: ` ${key}\n`, privateKeyPassphrase: passphrase });
            assert.strictEqual(jwt.authenticator, 'SNOWFLAKE_JWT');
            assert.strictEqual(jwt.privateKey, plain);
            assert.strictEqual(jwt.password, undefined);
            // the real driver accepts the options
            realCreateConnection.call(sdk, jwt);
        }
        assert.throws(() => connectionOptions({ ...base, privateKey: encrypted }), /Invalid private key/);
        assert.throws(() => connectionOptions({ ...base, privateKey: 'not a key' }), /Invalid private key/);
    });

    it('closes the connection after a query, also when it fails', async () => {

        let log = installFakeDriver({ rows: [{ A: 1 }] });
        const rows = await new SnowflakeDB().collectRows({}, { sqlText: 'SELECT 1' });
        assert.deepStrictEqual(rows, [{ A: 1 }]);
        assert.strictEqual(log.destroyed, 1);

        const failure = new Error('SQL compilation error');
        log = installFakeDriver({ error: failure });
        await assert.rejects(new SnowflakeDB().collectRows({}, { sqlText: 'SELEC 1' }), failure);
        assert.strictEqual(log.destroyed, 1);
    });

    it('closes the connection when a row stream ends', async () => {

        const log = installFakeDriver({ rows: [{ A: 1 }, { A: 2 }] });
        const stream = await new SnowflakeDB().getRows({}, { sqlText: 'SELECT 1' });
        const rows = [];
        for await (const row of stream) rows.push(row);
        assert.strictEqual(rows.length, 2);
        await new Promise(resolve => setImmediate(resolve));
        assert.strictEqual(log.destroyed, 1);
    });

    it('pairs updated rows by row ID regardless of order', () => {

        const data = [
            { METADATA$ACTION: 'INSERT', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r2', ID: 2, NAME: 'b-new' },
            { METADATA$ACTION: 'DELETE', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r1', ID: 1, NAME: 'a-old' },
            { METADATA$ACTION: 'DELETE', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r2', ID: 2, NAME: 'b-old' },
            { METADATA$ACTION: 'INSERT', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r1', ID: 1, NAME: 'a-new' }
        ];
        assert.deepStrictEqual(pairUpdates(data), [
            { oldRow: { ID: 2, NAME: 'b-old' }, updatedRow: { ID: 2, NAME: 'b-new' } },
            { oldRow: { ID: 1, NAME: 'a-old' }, updatedRow: { ID: 1, NAME: 'a-new' } }
        ]);
    });

    it('quotes names in stream statements', async () => {

        const log = installFakeDriver();
        await new SnowflakeDB().createStream(contextFor({}), 'PUBLIC', 'Order Items');
        assert.strictEqual(log.statements[0].sqlText,
            'CREATE OR REPLACE STREAM PUBLIC."Order Items_change_1234abcd" ON TABLE PUBLIC."Order Items"');
    });
});

describe('snowflake Query', () => {

    it('requires a query', async () => {

        installFakeDriver();
        await assert.rejects(Query.receive(contextFor({ query: ' ', outputType: 'rows' })), CancelError);
    });

    it('binds the Parameters to the ? placeholders', async () => {

        const log = installFakeDriver({ rows: [{ NAME: 'O\'Brien' }] });
        const context = contextFor({
            query: 'SELECT NAME FROM PUBLIC.USERS WHERE NAME = ? AND AGE > ?',
            outputType: 'rows',
            parameters: { ADD: [{ value: 'O\'Brien' }, { value: 30 }] }
        });
        await Query.receive(context);
        assert.deepStrictEqual(log.statements[0].binds, ['O\'Brien', 30]);
        assert.deepStrictEqual(context.sent[0], { data: { rows: [{ NAME: 'O\'Brien' }] }, port: 'out' });
    });

    it('sends one message per row and streams files', async () => {

        installFakeDriver({ rows: [{ A: 1 }, { A: 2 }] });
        let context = contextFor({ query: 'SELECT A', outputType: 'row' });
        await Query.receive(context);
        assert.deepStrictEqual(context.sent.map(s => s.data), [
            { row: { A: 1 }, index: 0 },
            { row: { A: 2 }, index: 1 }
        ]);

        context = contextFor({ query: 'SELECT A', outputType: 'file' });
        await Query.receive(context);
        assert.strictEqual(context.sent[0].body, 'A\n1\n2\n');
        assert.deepStrictEqual(context.sent[1], { data: { fileId: 'file-1' }, port: 'out' });
    });

    it('rejects an unknown output type', async () => {

        installFakeDriver();
        await assert.rejects(Query.receive(contextFor({ query: 'SELECT 1', outputType: 'csv' })), CancelError);
    });
});

describe('snowflake AddRow', () => {

    it('inserts with bind parameters and quoted names', async () => {

        const log = installFakeDriver();
        const context = contextFor({ schema: 'PUBLIC', table: 'USERS', NAME: 'O\'Brien\'); DROP TABLE USERS; --', 'Last Name': 'X' });
        await AddRow.receive(context);
        assert.strictEqual(log.statements[0].sqlText, 'INSERT INTO PUBLIC.USERS (NAME, "Last Name") VALUES (?, ?)');
        assert.deepStrictEqual(log.statements[0].binds, ['O\'Brien\'); DROP TABLE USERS; --', 'X']);
        assert.deepStrictEqual(context.sent[0].data, { row: { NAME: 'O\'Brien\'); DROP TABLE USERS; --', 'Last Name': 'X' } });
    });

    it('requires schema and table', async () => {

        installFakeDriver();
        await assert.rejects(AddRow.receive(contextFor({ table: 'USERS', NAME: 'x' })), /Schema is required/);
        await assert.rejects(AddRow.receive(contextFor({ schema: 'PUBLIC', NAME: 'x' })), /Table is required/);
    });
});

describe('snowflake UpdatedRow', () => {

    it('emits paired rows from the stream', async () => {

        installFakeDriver({ rows: [
            { METADATA$ACTION: 'INSERT', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r1', ID: 1, NAME: 'new' },
            { METADATA$ACTION: 'DELETE', METADATA$ISUPDATE: true, METADATA$ROW_ID: 'r1', ID: 1, NAME: 'old' }
        ] });
        const context = contextFor({}, { schema: 'PUBLIC', table: 'USERS' });
        await UpdatedRow.tick(context);
        assert.deepStrictEqual(context.sent, [{ data: { oldRow: { ID: 1, NAME: 'old' }, updatedRow: { ID: 1, NAME: 'new' } }, port: 'out' }]);
    });
});

describe('snowflake ListTables', () => {

    it('returns no options as a source without a schema, and cancels as an action', async () => {

        installFakeDriver();
        const source = contextFor({}, { sendWholeArray: true });
        await ListTables.receive(source);
        assert.deepStrictEqual(source.sent, [{ data: { tables: [] }, port: 'tables' }]);
        await assert.rejects(ListTables.receive(contextFor({})), CancelError);
    });
});

describe('snowflake auth', () => {

    it('asks for a token, password or private key', async () => {

        installFakeDriver();
        const { validate } = auth.definition();
        await assert.rejects(validate({ account: 'a', username: 'u', database: 'd', warehouse: 'w' }), /programmatic access token/);
        const log = installFakeDriver();
        assert.strictEqual(await validate({ account: 'a', username: 'u', password: 'p', database: 'd', warehouse: 'w' }), true);
        assert.strictEqual(log.destroyed, 1);
    });
});
