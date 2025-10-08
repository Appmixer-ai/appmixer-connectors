const { Pool, Client } = require('pg');
const QueryStream = require('pg-query-stream');
const { stringify } = require('csv-stringify');
const crypto = require('crypto');

// ConnectionHash: { components: Set, pool: Pool }
const POOLS = {};

// Create a dummy client for escaping (no connection required for these methods)
const dummyClient = new Client();

module.exports = {

    query: async (context, query, values) => {

        const pool = ensurePool(context);
        return pool.query(query, values);
    },

    streamQueryToFile: async (context, filename, query) => {

        // QueryStream can't be used directly with the pool.query function in node-postgres.
        // The pool.query method is a convenience function that automatically acquires a client,
        // executes the query, and then releases the client back to the pool.
        // However, streaming with QueryStream requires holding onto a database client
        // for the duration of the stream, which is incompatible with pool.query.
        const pool = ensurePool(context);
        const client = await pool.connect();

        try {
            const queryStream = new QueryStream(query);
            const dbStream = client.query(queryStream);
            const stringifier = stringify({ header: true });
            const savedFile = await context.saveFileStream(filename, dbStream.pipe(stringifier));
            return savedFile;
        } catch (err) {
            throw err;
        } finally {
            client.release();
        }
    },

    connect: async (context) => {

        const pool = ensurePool(context);
        return pool.connect();
    },

    disconnect: async (context) => {

        const record = POOLS[connectionHash(context.auth)];
        if (!record) {
            return;
        }
        record.components.delete(context.componentId);
        if (record.components.size === 0) {
            await record.pool.end();
            delete POOLS[context.connectionHash];
        }
    },

    sanitizeOperator: (operator, context) => {
        const trimmedOperator = (operator ?? '').trim();
        const normalizedOperator = trimmedOperator.toUpperCase();

        if (!SAFE_OPERATORS.has(normalizedOperator)) {
            throw new context.CancelError(`Unsupported operator "${operator}"`);
        }

        return normalizedOperator;
    },

    /**
     * Escapes a PostgreSQL identifier (table name, column name, schema name, etc.)
     * to prevent SQL injection.
     * @param {string} identifier - The identifier to escape
     * @returns {string} The escaped identifier wrapped in double quotes
     */
    escapeIdentifier: (identifier) => {
        return dummyClient.escapeIdentifier(identifier);
    },

    /**
     * Escapes a literal value for use in SQL queries to prevent SQL injection.
     * @param {string} literal - The literal value to escape
     * @returns {string} The escaped literal wrapped in single quotes
     */
    escapeLiteral: (literal) => {
        return dummyClient.escapeLiteral(literal);
    }
};

// Operator sanitizer helper for components
const SAFE_OPERATORS = new Set([
    '=', '!=', '<>', '<', '<=', '>', '>=',
    'CONTAINS', 'NOT CONTAINS', 'STARTS WITH', 'NOT STARTS WITH',
    'ENDS WITH', 'NOT ENDS WITH', 'IN', 'NOT IN',
    'LIKE', 'NOT LIKE', 'IS NULL', 'IS NOT NULL'
]);


module.exports.SAFE_OPERATORS = SAFE_OPERATORS;

function ensurePool(context) {

    const poolId = connectionHash(context.auth);
    const record = POOLS[poolId];
    let pool;
    if (!record) {
        pool = createPool(context);
        POOLS[poolId] = { components: new Set([context.componentId]), pool };
    } else {
        record.components.add(context.componentId);
        pool = record.pool;
    }
    return pool;
}

function connectionHash(auth) {

    const authString = JSON.stringify(auth);
    return crypto.createHash('md5').update(authString).digest('hex');
}

function createPool(context) {

    return new Pool({
        user: context.auth.dbUser,
        host: context.auth.dbHost,
        database: context.auth.database,
        password: context.auth.dbPassword,
        port: context.auth.dbPort,
        // https://node-postgres.com/apis/client
        statement_timeout: context.config.pool_statement_timeout,
        query_timeout: context.config.pool_query_timeout,
        lock_timeout: context.config.pool_lock_timeout,
        application_name: context.config.pool_application_name,
        // https://node-postgres.com/apis/pool
        connectionTimeoutMillis: context.config.pool_connectionTimeoutMillis,
        idleTimeoutMillis: context.config.pool_idleTimeoutMillis,
        max: context.config.pool_max || 10,
        allowExitOnIdle: context.config.pool_allowExitOnIdle
    });
}
