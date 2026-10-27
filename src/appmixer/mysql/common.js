'use strict';

const mysql = require('mysql2');
const EventEmitter = require('events');

class StreamProcessor {

    constructor(context) {

        this.eventEmitter = new EventEmitter();
        this.context = context;
    }

    processStream(conn, queryStream, processCb, concurrency = 1) {

        let promises = [];
        return new Promise((resolve, reject) => {
            const processCallback = async (row) => {
                try {
                    return await processCb(row);
                } catch (err) {
                    // Just log the error. This prevents the promise chain from breaking if there
                    // was an error while processing a row.
                    this.context.log('error', err.message, err);
                }
            };

            queryStream
                .on('error', async (err) => {
                    // Handle error, an 'end' event will be emitted after this as well
                    reject(err);
                })
                .on('result', async (row) => {
                    // Pausing the connection is useful if your processing involves I/O

                    const promise = processCallback(row);
                    promises.push(promise);
                    if (promises.length >= concurrency) {
                        conn.pause();
                        this.eventEmitter.emit('batchProcessed');
                        await Promise.all(promises);
                        promises = [];
                        conn.resume();
                    }
                })
                .on('end', async () => {
                    // all rows have been received
                    await Promise.all(promises);
                    resolve();
                })
                .resume();
        });
    }

    onBatchProcessed(callback) {

        this.eventEmitter.on('batchProcessed', callback);
    }
}

const DEFAULT_PORT = 3306;

function isEnabled(value) {

    return value === true || String(value).trim().toLowerCase() === 'true';
}

/**
 * Builds the `ssl` option for mysql2 from the account fields.
 * - CA certificate filled: encrypted connection, server certificate checked against the CA.
 * - Use SSL on, no CA: encrypted connection, server certificate not checked.
 * - Neither: no SSL (the behaviour of accounts created before 3.0.0).
 * @param {Object} auth - The account fields (context.auth in components, context in auth.js).
 * @returns {Object|undefined}
 */
function buildSslOptions(auth) {

    const ca = typeof auth.sslCa === 'string' ? auth.sslCa.trim() : '';
    if (ca) {
        return { ca, rejectUnauthorized: true };
    }
    if (isEnabled(auth.useSsl)) {
        return { rejectUnauthorized: false };
    }
    return undefined;
}

/**
 * Connection options shared by auth.js validate() and every component.
 * @param {Object} auth - The account fields (context.auth in components, context in auth.js).
 * @returns {Object} Options for mysql2 createConnection().
 */
function buildConnectionOptions(auth) {

    const opt = {
        user: auth.dbUser,
        host: auth.dbHost,
        database: auth.database,
        password: auth.dbPassword,
        port: DEFAULT_PORT,
        dateStrings: true,
        supportBigNumbers: true,
        // Keep the value types of the old `mysql` driver: JSON columns as strings,
        // DECIMAL columns as numbers.
        jsonStrings: true,
        decimalNumbers: true
    };

    const port = auth.dbPort !== undefined && auth.dbPort !== null ? String(auth.dbPort).trim() : '';
    if (port) {
        if (!/^\d+$/.test(port)) {
            throw new Error(`Invalid database port "${auth.dbPort}". Enter a number, e.g. 3306.`);
        }
        opt.port = parseInt(port, 10);
    }

    const ssl = buildSslOptions(auth);
    if (ssl) {
        opt.ssl = ssl;
    }

    return opt;
}

/**
 * Opens a connection with the shared options.
 * @param {Object} auth - The account fields (context.auth in components, context in auth.js).
 * @returns {Promise<Object>} A connected mysql2 connection. The caller must call end().
 */
async function connect(auth) {

    const conn = mysql.createConnection(buildConnectionOptions(auth));

    await new Promise((resolve, reject) => {
        conn.connect(err => {
            if (err) {
                conn.destroy();
                return reject(err);
            }
            resolve();
        });
    });

    return conn;
}

async function createConnection(context) {

    return connect(context.auth);
}

/**
 * Validates that a SQL query starts with SELECT or WITH (for CTEs).
 * Multiple statements are blocked by the mysql2 driver default (multipleStatements: false).
 * @param {string} query - The SQL query to validate
 * @throws {Error} If the query doesn't start with SELECT or WITH
 */
function validateQuery(query) {
    if (!/^\s*(select|with)\s/i.test(query)) {
        throw new Error('Only SELECT or WITH queries are allowed');
    }
}

async function runQuery(conn, query, params) {

    return await conn.query(query, params).stream({ highWaterMark: 10 });
}

/**
 * Read-only helper shared by trigger test() methods (Flow Test Mode).
 *
 * Runs the SAME validated SELECT path tick()/start() use (createConnection + validateQuery +
 * runQuery + StreamProcessor), but collects rows into a local array instead of writing them to
 * the data store. It does NOT touch component/flow/service state, register webhooks or mutate
 * anything remote. It returns the "newest" row from the result set, picked by the configured
 * idField (highest numeric id, falling back to string comparison), so the emitted example
 * matches what the trigger would eventually deliver via receive().
 *
 * @param {Object} context - The component context (auth + properties available).
 * @param {string} query - The user-supplied SELECT query.
 * @param {Array} params - Query parameters (e.g. [0] to fetch all rows since epoch).
 * @param {string} idField - The unique field used to order/identify rows.
 * @returns {Promise<Object|null>} The newest row, or null if the result set is empty.
 */
async function fetchLatestRow(context, query, params, idField) {

    let conn;
    let latest = null;

    const isNewer = (candidate, current) => {
        if (current === null) return true;
        const a = candidate[idField];
        const b = current[idField];
        const numA = Number(a);
        const numB = Number(b);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA > numB;
        }
        return String(a) > String(b);
    };

    try {
        validateQuery(query);
        conn = await createConnection(context);
        const stream = await runQuery(conn, query, params);
        const concurrency = parseInt(context.config.concurrency, 10) || 100;

        const streamProcessor = new StreamProcessor(context);
        await streamProcessor.processStream(conn, stream, async (row) => {
            if (isNewer(row, latest)) {
                latest = row;
            }
        }, concurrency);
    } finally {
        if (conn) {
            conn.end();
        }
    }

    return latest;
}

module.exports = {

    StreamProcessor,

    createQueryProcessor(context, storeId, query, params, lock) {

        return async (callback) => {

            let conn;
            try {
                validateQuery(query);
                conn = await createConnection(context);
                const stream = await runQuery(conn, query, params);
                const concurrency = parseInt(context.config.concurrency, 10) || 100;

                const streamProcessor = new StreamProcessor(context);
                streamProcessor.onBatchProcessed(() => {
                    lock.extend(parseInt(context.config.lockExtendTime, 10) || 1000 * 60 * 2);
                });

                await streamProcessor.processStream(conn, stream, callback, concurrency);
            } finally {
                if (conn) {
                    conn.end();
                }
            }
        };
    },

    async ensureStore(context, storeId, storeName) {

        const stateStoreId = await context.stateGet('storeId');
        let returnStoreId = storeId || stateStoreId;

        if (!storeId) {
            try {
                const newStoreResponse = await context.callAppmixer({
                    endPoint: '/stores',
                    method: 'POST',
                    body: {
                        name: storeName
                    }
                });
                returnStoreId = newStoreResponse.storeId;
            } catch (err) {
                // Ignore error if the store already exists
                if (!err.message.includes('duplicate key error')) {
                    throw err;
                }
                const stores = await context.callAppmixer({
                    endPoint: '/stores',
                    method: 'GET'
                });
                const selectedStore = stores.find(store => store.name === storeName);
                returnStoreId = selectedStore.storeId;
            }
        }

        await context.stateSet('storeId', returnStoreId);
        return returnStoreId;
    },

    runQuery,
    validateQuery,
    fetchLatestRow,
    buildConnectionOptions,
    connect,
    createConnection
};
