'use strict';

const crypto = require('crypto');

const { VERSION_HEADER } = require('./constants');

function getCacheKey(obj) {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/**
 * Headers required by the versioned LinkedIn REST API.
 * @param {Context} context
 * @returns {Object}
 */
function getHeaders(context) {

    return {
        'Authorization': `Bearer ${context.auth.accessToken}`,
        'LinkedIn-Version': VERSION_HEADER,
        'X-Restli-Protocol-Version': '2.0.0'
    };
}

/**
 * Run `fn` once per cache key and keep its result for a short time. Used by
 * components that back inspector dropdowns - the designer fires those calls
 * in bursts every time an inspector opens.
 * @param {Context} context
 * @param {Object} keyParts Everything that shapes the result (the token is added automatically).
 * @param {Function} fn Async function producing the value to cache.
 * @param {number} [ttl] Cache TTL in ms; `listCacheTTL` from the service config wins when set.
 * @returns {Promise<*>}
 */
async function withCache(context, keyParts, fn, ttl = 2 * 60 * 1000) {

    let lock;
    try {
        const key = getCacheKey({ ...keyParts, token: context.auth.accessToken });
        // The first caller may need several requests; let the rest of the burst wait up to 30 s.
        lock = await context.lock(key, { ttl: 60 * 1000, retryDelay: 500, maxRetryCount: 60 });

        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }

        const value = await fn();
        await context.staticCache.set(
            key,
            value,
            context.config.listCacheTTL || ttl
        );
        return value;
    } finally {
        lock?.unlock();
    }
}

module.exports = { getHeaders, withCache };
