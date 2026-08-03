'use strict';

const { Client } = require('pg');

/**
 * Process-global storage for live pg.Client instances running dblink async queries.
 * Same pattern as Kafka connector — survives require() cache clears across components
 * on the same node, but is lost on process restart (jobs.js handles recovery).
 *
 * Key: jobId
 * Value: { client: pg.Client, dblinkConnName: string }
 */
let PG_ASYNC_CONNECTIONS;
if (process.PG_ASYNC_CONNECTIONS) {
    PG_ASYNC_CONNECTIONS = process.PG_ASYNC_CONNECTIONS;
} else {
    process.PG_ASYNC_CONNECTIONS = PG_ASYNC_CONNECTIONS = {};
}

/**
 * Builds a libpq connection URI for dblink_connect.
 * dblink needs to connect back to the same database.
 * A URI with percent-encoded parts is used instead of the key=value conninfo
 * format so that values containing spaces or conninfo metacharacters
 * (quotes, backslashes, '=') cannot break parsing or inject parameters.
 */
const buildConnStr = (auth) => {
    const user = encodeURIComponent(auth.dbUser);
    const password = encodeURIComponent(auth.dbPassword);
    const host = encodeURIComponent(auth.dbHost);
    const port = auth.dbPort || 5432;
    const dbname = encodeURIComponent(auth.database);
    return `postgresql://${user}:${password}@${host}:${port}/${dbname}`;
};

/**
 * Opens a dedicated pg.Client, creates a named dblink connection,
 * and fires the query asynchronously via dblink_send_query.
 *
 * The client MUST stay open — the dblink session is scoped to the client session.
 * Results are fetched via pollJob() once dblink_is_busy() returns 0.
 *
 * @param {object} auth   - PG credentials from context.auth
 * @param {string} jobId  - Unique job ID (used as key in PG_ASYNC_CONNECTIONS)
 * @param {string} query  - The SQL query to run asynchronously
 * @returns {string}      - dblinkConnName used for polling/cleanup
 */
const startAsyncQuery = async (auth, jobId, query) => {

    // Sanitize jobId into a valid PG identifier for the dblink connection name
    const dblinkConnName = `am_${jobId.replace(/[^a-z0-9]/gi, '_')}`;

    const client = new Client({
        host: auth.dbHost,
        port: auth.dbPort || 5432,
        database: auth.database,
        user: auth.dbUser,
        password: auth.dbPassword
    });

    await client.connect();

    // Ensure dblink extension is available (idempotent)
    await client.query('CREATE EXTENSION IF NOT EXISTS dblink');

    // Open a named dblink session back to the same database
    const connStr = buildConnStr(auth);
    await client.query('SELECT dblink_connect($1, $2)', [dblinkConnName, connStr]);

    // Strip trailing semicolons — they break the subquery wrapper syntax
    const cleanQuery = query.replace(/;\s*$/, '');

    // Wrap user query in row_to_json() so dblink_get_result can use a generic
    // single-column (text) signature — avoids the "define column types" problem.
    const wrappedQuery = `SELECT row_to_json(t)::text AS _row FROM (${cleanQuery}) t`;

    // dblink_send_query fires the query and returns immediately (non-blocking)
    const sendResult = await client.query(
        'SELECT dblink_send_query($1, $2) AS sent',
        [dblinkConnName, wrappedQuery]
    );

    if (sendResult.rows[0]?.sent !== 1) {
        await client.end();
        throw new Error('[PG_ASYNC] dblink_send_query did not return 1 — query may not have started.');
    }

    PG_ASYNC_CONNECTIONS[jobId] = { client, dblinkConnName };

    return dblinkConnName;
};

/**
 * Checks whether the async query is still running.
 * Returns null if the connection is not on this node.
 * Returns { status: 'pending' } if still running.
 * Returns { status: 'done', rows: Array } when complete.
 *
 * @param {string} jobId
 * @returns {null | { status: 'pending' } | { status: 'done', rows: object[] }}
 */
const pollJob = async (jobId) => {

    const conn = PG_ASYNC_CONNECTIONS[jobId];
    if (!conn) return null; // not on this node

    const { client, dblinkConnName } = conn;

    const busyRes = await client.query(
        'SELECT dblink_is_busy($1) AS busy',
        [dblinkConnName]
    );

    if (busyRes.rows[0].busy === 1) {
        return { status: 'pending' };
    }

    // Query is done — fetch results via dblink_get_result
    // Using the generic single-column signature matching our row_to_json wrapper
    const resultRes = await client.query(
        'SELECT * FROM dblink_get_result($1) AS r(json_row text)',
        [dblinkConnName]
    );

    const rows = resultRes.rows.map(r => {
        try {
            return JSON.parse(r.json_row);
        } catch (e) {
            return { raw: r.json_row };
        }
    });

    return { status: 'done', rows };
};

/**
 * Disconnects the dblink session and closes the pg.Client.
 * Safe to call even if the connection doesn't exist locally.
 *
 * @param {string} jobId
 */
const closeConnection = async (jobId) => {

    const conn = PG_ASYNC_CONNECTIONS[jobId];
    if (!conn) return;

    try {
        await conn.client.query('SELECT dblink_disconnect($1)', [conn.dblinkConnName]);
    } catch (_) {
        // Ignore — session may have already expired or been terminated
    }

    try {
        await conn.client.end();
    } catch (_) { /* ignore */ }

    delete PG_ASYNC_CONNECTIONS[jobId];
};

/**
 * Returns the current in-memory connections map (for jobs sync logic).
 */
const listConnections = () => PG_ASYNC_CONNECTIONS;

module.exports = {
    startAsyncQuery,
    pollJob,
    closeConnection,
    listConnections
};
