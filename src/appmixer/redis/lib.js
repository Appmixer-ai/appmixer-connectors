'use strict';

const redis = require('redis');
const pathModule = require('path');

const DEFAULT_PREFIX = 'redis-objects-export';

/**
 * Creates and connects a Redis client with the provided credentials.
 * @param {Object} auth - Authentication credentials
 * @param {string} auth.url - Redis connection URL
 * @param {boolean} [isTest=false] - Whether this is a test connection
 * @returns {Promise<Object>} Connected Redis client
 */
async function createRedisClient(auth, isTest = false) {

    const clientOptions = {};

    // Ensure socket object exists
    clientOptions.socket = {};

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

    const client = redis.createClient({ url: auth.url, ...clientOptions });

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

/**
 * Sends array output in various formats based on outputType.
 * Handles 'array', 'first', 'object', and 'file' output types.
 * @param {Object} options
 * @param {Object} options.context - Component context
 * @param {string} options.outputPortName - Output port name (default: 'out')
 * @param {string} options.outputType - Output type: 'array', 'first', 'object', 'file'
 * @param {Array} options.records - Array of records to send
 * @returns {Promise<void>}
 */
async function sendArrayOutput({
    context,
    outputPortName = 'out',
    outputType = 'array',
    records = []
}) {
    if (outputType === 'first') {
        if (records.length === 0) {
            throw new context.CancelError('No records available for first output type');
        }
        await context.sendJson(
            { ...records[0], index: 0, count: records.length },
            outputPortName
        );
    } else if (outputType === 'object') {
        for (let index = 0; index < records.length; index++) {
            await context.sendJson(
                { ...records[index], index, count: records.length },
                outputPortName
            );
        }
    } else if (outputType === 'array') {
        await context.sendJson({ result: records, count: records.length }, outputPortName);
    } else if (outputType === 'file') {
        const csvString = toCsv(records);
        let buffer = Buffer.from(csvString, 'utf8');
        const componentName = context.flowDescriptor[context.componentId].label || context.componentId;
        const fileName = `${context.config.outputFilePrefix || DEFAULT_PREFIX}-${componentName}.csv`;
        const savedFile = await context.saveFileStream(pathModule.normalize(fileName), buffer);
        await context.log({ step: 'File was saved', fileName, fileId: savedFile.fileId });
        await context.sendJson({ fileId: savedFile.fileId }, outputPortName);
    } else {
        throw new context.CancelError('Unsupported outputType ' + outputType);
    }
}

/**
 * Returns output port options based on outputType and schema.
 * @param {Object} context - Component context
 * @param {string} outputType - Output type: 'array', 'first', 'object', 'file'
 * @param {Object} itemSchema - Schema of individual items
 * @param {Object} options
 * @param {string} options.label - Label for array output
 * @param {string} options.value - Value field name for array output
 * @returns {Promise<void>}
 */
function getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
    if (outputType === 'object' || outputType === 'first') {
        const options = Object.keys(itemSchema)
            .reduce((res, field) => {
                const schema = itemSchema[field];
                const { title: fieldLabel, ...schemaWithoutTitle } = schema;
                res.push({ label: fieldLabel, value: field, schema: schemaWithoutTitle });
                return res;
            }, [{
                label: 'Current Item Index',
                value: 'index',
                schema: { type: 'integer' }
            }, {
                label: 'Items Count',
                value: 'count',
                schema: { type: 'integer' }
            }]);
        return context.sendJson(options, 'out');
    }

    if (outputType === 'array') {
        return context.sendJson([{
            label,
            value,
            schema: {
                type: 'array',
                items: { type: 'object', properties: itemSchema }
            }
        }], 'out');
    }

    if (outputType === 'file') {
        return context.sendJson([{ label: 'File ID', value: 'fileId' }], 'out');
    }
}

/**
 * Converts an array of objects to CSV format.
 * @param {Array} array - Array of objects to convert
 * @returns {string} CSV formatted string
 */
function toCsv(array) {
    if (array.length === 0) {
        return '';
    }
    const headers = Object.keys(array[0]);
    return [
        headers.join(','),
        ...array.map(items => {
            return Object.values(items).map(property => {
                if (typeof property === 'object') {
                    return JSON.stringify(property);
                }
                return property;
            }).join(',');
        })
    ].join('\n');
}

module.exports = {
    createRedisClient,
    getParsedValue,
    getValue,
    setValue,
    sendArrayOutput,
    getOutputPortOptions
};
