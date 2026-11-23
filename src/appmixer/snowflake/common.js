const crypto = require('crypto');
const snowflake = require('snowflake-sdk');

// Turn the driver's own logger off. snowflake-sdk before 3.3.0 can write auth tokens and other
// secrets to its diagnostic logs (GHSA-qqj6-54q6-cxv6), and 3.3.0 needs Node 20.
// Driver errors still reach the components through the callbacks.
snowflake.configure({ logLevel: 'OFF' });

// Names are double-quoted, which makes each one a single identifier that cannot break the statement.
// Snowflake stores unquoted names in upper case, so quoting an upper-case name changes nothing
// (and makes reserved words such as ORDER usable). A plain name typed in lower or mixed case stays
// unquoted, so it keeps resolving case-insensitively the way it always did.
const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_$]*$/;

function identifier(name, label = 'Identifier') {

    if (typeof name !== 'string' || !name.trim()) {
        throw new Error(`${label} is required.`);
    }
    if (SIMPLE_IDENTIFIER.test(name) && name !== name.toUpperCase()) {
        return name;
    }
    return `"${name.replace(/"/g, '""')}"`;
}

// Bind values must be strings, numbers, booleans, dates or null.
function bindValue(value) {

    if (value === undefined || value === null) return null;
    if (typeof value === 'object' && !(value instanceof Date)) return JSON.stringify(value);
    return value;
}

function connectionOptions(auth) {

    const { account, username, password, privateKey, privateKeyPassphrase, database, warehouse } = auth;
    const options = { account, username, database, warehouse };
    if (privateKey && privateKey.trim()) {
        // Key-pair authentication. Snowflake no longer accepts a password alone for most users.
        // The driver takes only an unencrypted PKCS#8 PEM, so decrypt and convert the key here
        // (this also accepts PKCS#1 "BEGIN RSA PRIVATE KEY" keys).
        let key;
        try {
            key = crypto.createPrivateKey({ key: privateKey.trim(), format: 'pem', passphrase: privateKeyPassphrase || undefined });
        } catch (err) {
            throw new Error('Invalid private key: ' + err.message + '. Paste the whole PEM key, and its passphrase if it is encrypted.');
        }
        options.authenticator = 'SNOWFLAKE_JWT';
        options.privateKey = key.export({ type: 'pkcs8', format: 'pem' });
    } else {
        // A password, or a programmatic access token used in its place.
        options.password = password;
    }
    return options;
}

function destroy(connection) {

    return new Promise(resolve => {
        if (!connection || !connection.isUp()) return resolve();
        connection.destroy(() => resolve());
    });
}

// Run one statement on an open connection and resolve with all its rows.
function run(connection, { sqlText, binds }) {

    return new Promise((resolve, reject) => {
        connection.execute({
            sqlText,
            binds: binds && binds.length ? binds.map(bindValue) : undefined,
            // Never throw from this callback: an exception here would end the whole process.
            complete: (err, stmt, rows) => (err ? reject(err) : resolve(rows || []))
        });
    });
}

// Sessions are never kept or shared: every call opens its own connection and closes it when done.
class SnowflakeDB {

    async getConnection(auth) {

        const connection = snowflake.createConnection(connectionOptions(auth));
        await new Promise((resolve, reject) => {
            connection.connect(err => (err ? reject(err) : resolve()));
        });
        return connection;
    }

    /**
     * Open a connection, pass it to fn and close it when fn settles.
     * @param {Object} auth
     * @param {function(Object): Promise<*>} fn
     */
    async withConnection(auth, fn) {

        const connection = await this.getConnection(auth);
        try {
            return await fn(connection);
        } finally {
            await destroy(connection);
        }
    }

    /**
     * Run a statement and resolve with all its rows. The connection is closed afterwards.
     * @param {Object} auth
     * @param {{ sqlText: string, binds?: Array }} statement
     * @returns {Promise<Array<Object>>}
     */
    async collectRows(auth, statement) {

        return this.withConnection(auth, connection => run(connection, statement));
    }

    /**
     * Run a statement and resolve with a readable stream of its rows. The connection is closed
     * when the stream ends, fails or is closed.
     * @param {Object} auth
     * @param {{ sqlText: string, binds?: Array }} statement
     * @returns {Promise<import('stream').Readable>}
     */
    async getRows(auth, { sqlText, binds }) {

        const connection = await this.getConnection(auth);
        try {
            const stream = await new Promise((resolve, reject) => {
                connection.execute({
                    sqlText,
                    binds: binds && binds.length ? binds.map(bindValue) : undefined,
                    streamResult: true,
                    complete: (err, stmt) => (err ? reject(err) : resolve(stmt.streamRows()))
                });
            });
            let closed = false;
            const close = () => {
                if (!closed) {
                    closed = true;
                    destroy(connection);
                }
            };
            stream.once('end', close);
            stream.once('error', close);
            stream.once('close', close);
            return stream;
        } catch (err) {
            await destroy(connection);
            throw err;
        }
    }

    async listSchemas(auth) {

        return this.collectRows(auth, { sqlText: 'SHOW SCHEMAS' });
    }

    async listTables(auth, schema) {

        const sqlText = `SHOW TABLES IN ${identifier(auth.database, 'Database')}.${identifier(schema, 'Schema')}`;
        return this.collectRows(auth, { sqlText });
    }

    async listColumns(auth, schema, table) {

        const sqlText = `SHOW COLUMNS IN ${identifier(schema, 'Schema')}.${identifier(table, 'Table')}`;
        return this.collectRows(auth, { sqlText });
    }

    async addRow(auth, schema, table, columns, values) {

        const columnList = columns.map(column => identifier(column, 'Column')).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const sqlText = `INSERT INTO ${identifier(schema, 'Schema')}.${identifier(table, 'Table')} (${columnList}) VALUES (${placeholders})`;
        return this.collectRows(auth, { sqlText, binds: values });
    }

    streamName(context, schema, table) {

        const componentId = context.componentId.replace(/-/g, '');
        return `${identifier(schema, 'Schema')}.${identifier(`${table}_change_${componentId}`, 'Table')}`;
    }

    async createStream(context, schema, table) {

        const sqlText = `CREATE OR REPLACE STREAM ${this.streamName(context, schema, table)} ON TABLE ${identifier(schema, 'Schema')}.${identifier(table, 'Table')}`;
        return this.collectRows(context.auth, { sqlText });
    }

    async consumeStream(context, schema, table, triggerType) {

        const stream = this.streamName(context, schema, table);
        let where = '';
        switch (triggerType) {
            case 'insert':
                where = ' WHERE METADATA$ACTION = \'INSERT\' AND METADATA$ISUPDATE = FALSE';
                break;
            case 'update':
                where = ' WHERE METADATA$ISUPDATE = TRUE';
                break;
            case 'delete':
                where = ' WHERE METADATA$ACTION = \'DELETE\' AND METADATA$ISUPDATE = FALSE';
                break;
        }
        // Reading a stream does not move its offset; only DML that reads the stream does. The INSERT
        // below reads the stream and inserts nothing, which advances the offset. Both run in one
        // transaction: a change committed by someone else in the meantime stays in the stream for
        // the next tick (outside a transaction the INSERT would skip it). The offset advances on
        // every tick, also when no row matched, so changes this trigger ignores (for example
        // deletes for New Row) do not pile up until the stream goes stale.
        return this.withConnection(context.auth, async connection => {
            await run(connection, { sqlText: 'BEGIN' });
            try {
                const data = await run(connection, { sqlText: `SELECT * FROM ${stream}${where}` });
                await run(connection, {
                    sqlText: `INSERT INTO ${identifier(schema, 'Schema')}.${identifier(table, 'Table')} ` +
                        `SELECT * EXCLUDE (METADATA$ACTION, METADATA$ISUPDATE, METADATA$ROW_ID) FROM ${stream} WHERE FALSE`
                });
                await run(connection, { sqlText: 'COMMIT' });
                return data;
            } catch (err) {
                await run(connection, { sqlText: 'ROLLBACK' }).catch(() => {});
                throw err;
            }
        });
    }

    async dropStream(context, schema, table) {

        const sqlText = `DROP STREAM IF EXISTS ${this.streamName(context, schema, table)}`;
        return this.collectRows(context.auth, { sqlText });
    }

    // Read-only fetch of a single representative row from the base table.
    // Used by trigger test() methods (Flow Test Mode) - never consumes/advances the
    // change stream and performs no mutations.
    async getSampleRow(auth, schema, table) {

        const sqlText = `SELECT * FROM ${identifier(schema, 'Schema')}.${identifier(table, 'Table')} LIMIT 1`;
        const data = await this.collectRows(auth, { sqlText });
        return data.length ? data[0] : null;
    }
}

/**
 * Pair the DELETE and INSERT halves of updated rows from a stream by METADATA$ROW_ID and
 * strip the stream's metadata columns.
 * @param {Array<Object>} data rows of a stream with METADATA$ISUPDATE = TRUE
 * @returns {Array<{ oldRow: Object, updatedRow: Object }>}
 */
function pairUpdates(data) {

    const strip = row => {
        // eslint-disable-next-line no-unused-vars
        const { METADATA$ACTION, METADATA$ISUPDATE, METADATA$ROW_ID, ...columns } = row;
        return columns;
    };
    const oldRows = new Map();
    for (const row of data) {
        if (row.METADATA$ACTION === 'DELETE') oldRows.set(row.METADATA$ROW_ID, row);
    }
    const pairs = [];
    for (const row of data) {
        if (row.METADATA$ACTION !== 'INSERT') continue;
        const oldRow = oldRows.get(row.METADATA$ROW_ID);
        pairs.push({ oldRow: oldRow ? strip(oldRow) : {}, updatedRow: strip(row) });
    }
    return pairs;
}

module.exports = { SnowflakeDB, identifier, bindValue, connectionOptions, pairUpdates };
