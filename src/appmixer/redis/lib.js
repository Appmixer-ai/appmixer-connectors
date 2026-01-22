'use strict';

const redis = require('redis');

/**
 * Creates and connects a Redis client with the provided credentials.
 * @param {Object} auth - Authentication credentials
 * @param {string} auth.host - Redis server host
 * @param {number} auth.port - Redis server port
 * @param {number} auth.database - Database number
 * @param {string} [auth.user] - Username (optional)
 * @param {string} [auth.password] - Password (optional)
 * @param {boolean} [auth.ssl] - Enable SSL/TLS
 * @param {boolean} [auth.disableTlsVerification] - Disable TLS verification
 * @param {boolean} [isTest=false] - Whether this is a test connection
 * @returns {Promise<Object>} Connected Redis client
 */
async function createRedisClient(auth, isTest = false) {
    const clientOptions = {
        socket: {
            host: auth.host,
            port: auth.port
        }
    };

    // Add authentication if provided
    if (auth.user) {
        clientOptions.username = auth.user;
    }
    if (auth.password) {
        clientOptions.password = auth.password;
    }

    // Configure SSL/TLS
    // clientOptions.socket.tls = true;

    // Configure reconnection strategy
    if (!isTest) {
        // Exponential backoff reconnection for production
        clientOptions.socket.reconnectStrategy = (retries) => {
            // Stop retrying after ~15 minutes
            if (retries > 13) {
                return new Error('Redis reconnection limit exceeded');
            }
            // Exponential backoff: 2^retries * 1000ms
            return Math.min(Math.pow(2, retries) * 1000, 60000);
        };
    } else {
        // Disable reconnection for tests
        clientOptions.socket.reconnectStrategy = false;
    }

    const client = redis.createClient(clientOptions);

    // Connect to Redis
    await client.connect();

    return client;
}

/**
 * Parses a value, converting numeric strings to floats.
 * @param {string} value - Value to parse
 * @returns {number|string} Parsed value
 */
function getParsedValue(value) {
    if (!isNaN(value) && value !== '') {
        return parseFloat(value);
    }
    return value;
}

/**
 * Retrieves a value from Redis by key and type.
 * @param {Object} client - Redis client instance
 * @param {string} keyName - Key to retrieve
 * @param {string} [type='automatic'] - Data type: 'automatic', 'string', 'hash', 'list', 'sets'
 * @returns {Promise<*>} Retrieved value
 */
async function getValue(client, keyName, type = 'automatic') {
    let actualType = type;

    // Auto-detect type if needed
    if (type === 'automatic') {
        actualType = await client.type(keyName);
    }

    switch (actualType) {
        case 'string':
            return await client.get(keyName);

        case 'hash':
            return await client.hGetAll(keyName);

        case 'list':
            return await client.lRange(keyName, 0, -1);

        case 'set':
        case 'sets':
            return await client.sMembers(keyName);

        default:
            throw new Error(`Unsupported Redis type: ${actualType}`);
    }
}

/**
 * Sets a value in Redis with optional expiration.
 * @param {Object} client - Redis client instance
 * @param {string} keyName - Key to set
 * @param {*} value - Value to store
 * @param {boolean} [expire=false] - Whether to set expiration
 * @param {number} [ttl=60] - Time to live in seconds
 * @param {string} [type='automatic'] - Data type: 'automatic', 'string', 'hash', 'list', 'sets'
 * @param {boolean} [valueIsJSON=false] - Whether value is JSON (for hash type)
 * @returns {Promise<void>}
 */
async function setValue(client, keyName, value, expire = false, ttl = 60, type = 'automatic', valueIsJSON = false) {
    let actualType = type;

    // Auto-detect type based on value
    if (type === 'automatic') {
        if (typeof value === 'string') {
            actualType = 'string';
        } else if (Array.isArray(value)) {
            actualType = 'list';
        } else if (typeof value === 'object' && value !== null) {
            actualType = 'hash';
        } else {
            actualType = 'string';
        }
    }

    switch (actualType) {
        case 'string':
            await client.set(keyName, String(value));
            break;

        case 'hash': {
            let hashValue = value;
            if (valueIsJSON && typeof value === 'string') {
                hashValue = JSON.parse(value);
            }
            await client.hSet(keyName, hashValue);
            break;
        }

        case 'list':
            // Clear existing list and push new values
            await client.del(keyName);
            const listValues = Array.isArray(value) ? value : [value];
            if (listValues.length > 0) {
                await client.rPush(keyName, listValues);
            }
            break;

        case 'set':
        case 'sets': {
            // Clear existing set and add new values
            await client.del(keyName);
            const setValues = Array.isArray(value) ? value : [value];
            if (setValues.length > 0) {
                await client.sAdd(keyName, setValues);
            }
            break;
        }

        default:
            throw new Error(`Unsupported Redis type: ${actualType}`);
    }

    // Set expiration if requested
    if (expire && ttl > 0) {
        await client.expire(keyName, ttl);
    }
}

module.exports = {
    createRedisClient,
    getParsedValue,
    getValue,
    setValue
};
