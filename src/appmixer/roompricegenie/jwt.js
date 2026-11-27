'use strict';

const crypto = require('crypto');

// Verification of the Bearer tokens RoomPriceGenie attaches to the updates it pushes
// (https://postman.roompricegenie.com/#28230fbc-5735-425b-a3f6-3dfba28cbc37).
//
// Written against node:crypto, without a JWT library, and deliberately narrow:
// - the algorithm is RS256 and nothing else. It is never read from the token to pick a
//   verification routine, so "none" and HS256 (signed with the public key as the secret) have no
//   code path at all;
// - the key comes from the key set of the configured RoomPriceGenie host, looked up by "kid".
//   Keys or key URLs inside a token ("jwk", "jku", "x5u", "x5c") are never used.

const ALGORITHM = 'RS256';
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LENGTH = 8192;
const MIN_MODULUS_BITS = 2048;

class JwtError extends Error {

    /**
     * @param {string} code a short machine-readable reason, safe to log
     * @param {string} message
     */
    constructor(code, message) {
        super(message);
        this.name = 'JwtError';
        this.code = code;
    }
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const decodeJsonSegment = (segment, name) => {

    let value;
    try {
        value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    } catch (err) {
        throw new JwtError('malformed', `The token ${name} is not JSON.`);
    }
    if (!isPlainObject(value)) {
        throw new JwtError('malformed', `The token ${name} is not an object.`);
    }
    return value;
};

/**
 * Split a compact JWS into its parts. Nothing is trusted yet.
 * @param {string} token
 * @returns {{ header: object, payload: object, signingInput: string, signature: Buffer }}
 */
const parse = (token) => {

    if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) {
        throw new JwtError('malformed', 'The token is missing or too long.');
    }
    const segments = token.split('.');
    // An unsigned token ("alg": "none") ends with a dot: its third segment is empty.
    if (segments.length !== 3 || segments.some(segment => !BASE64URL.test(segment))) {
        throw new JwtError('malformed', 'The token is not a signed JWT.');
    }
    return {
        header: decodeJsonSegment(segments[0], 'header'),
        payload: decodeJsonSegment(segments[1], 'payload'),
        signingInput: `${segments[0]}.${segments[1]}`,
        signature: Buffer.from(segments[2], 'base64url')
    };
};

/**
 * Verify a token and return its claims.
 * @param {string} token
 * @param {object} options
 * @param {Function} options.getKey async (kid) => crypto.KeyObject | undefined
 * @param {string} options.issuer the required "iss"
 * @param {number} [options.now] milliseconds, for tests
 * @param {number} [options.clockTolerance] seconds
 * @returns {Promise<object>} the payload
 * @throws {JwtError}
 */
const verify = async (token, { getKey, issuer, now = Date.now(), clockTolerance = 60 }) => {

    const { header, payload, signingInput, signature } = parse(token);

    if (header.alg !== ALGORITHM) {
        throw new JwtError('algorithm', `The token must be signed with ${ALGORITHM}.`);
    }
    if (header.crit !== undefined) {
        throw new JwtError('algorithm', 'The token uses an unsupported critical header.');
    }
    if (typeof header.kid !== 'string' || !header.kid) {
        throw new JwtError('kid', 'The token names no key.');
    }

    const key = await getKey(header.kid);
    if (!key) {
        throw new JwtError('unknown_key', 'The token is signed with an unknown key.');
    }
    if (key.type !== 'public' || key.asymmetricKeyType !== 'rsa') {
        throw new JwtError('unknown_key', 'The signing key is not an RSA public key.');
    }

    const valid = crypto.verify(
        'RSA-SHA256',
        Buffer.from(signingInput, 'ascii'),
        { key, padding: crypto.constants.RSA_PKCS1_PADDING },
        signature
    );
    if (!valid) {
        throw new JwtError('signature', 'The token signature is not valid.');
    }

    const seconds = Math.floor(now / 1000);
    if (payload.iss !== issuer) {
        throw new JwtError('issuer', 'The token was not issued by RoomPriceGenie.');
    }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
        throw new JwtError('expired', 'The token has no expiry time.');
    }
    if (payload.exp + clockTolerance <= seconds) {
        throw new JwtError('expired', 'The token has expired.');
    }
    for (const claim of ['iat', 'nbf']) {
        if (payload[claim] !== undefined
            && (typeof payload[claim] !== 'number' || payload[claim] - clockTolerance > seconds)) {
            throw new JwtError('not_yet_valid', 'The token is not valid yet.');
        }
    }
    return payload;
};

/**
 * The audiences of a token as a list. RoomPriceGenie sends "aud" as an array of property codes
 * (empty for key rotation notices); a single string is accepted too.
 * @param {object} payload
 * @returns {string[]}
 */
const audiences = (payload) => {

    const aud = payload && payload.aud;
    if (typeof aud === 'string') {
        return aud ? [aud] : [];
    }
    return Array.isArray(aud) ? aud.filter(item => typeof item === 'string' && item) : [];
};

/**
 * Turn RoomPriceGenie's key set into verification keys.
 *
 * The answer of GET /integrations/jwk/ is { key: [ { kid, kty, n, e, key_ops } ], info: [ { kid,
 * expiry_date } ] } (the standard "keys" is accepted as well). Skipped: anything that is not an
 * RSA key of at least 2048 bits, a key that is not for verifying signatures, and a key whose
 * expiry date has passed.
 * @param {object} body
 * @param {number} [now] milliseconds
 * @returns {Map<string, crypto.KeyObject>}
 */
const keysFromJwks = (body, now = Date.now()) => {

    const keys = new Map();
    if (!isPlainObject(body)) {
        return keys;
    }
    const list = Array.isArray(body.key) ? body.key : (Array.isArray(body.keys) ? body.keys : []);
    const expired = new Set();
    for (const info of Array.isArray(body.info) ? body.info : []) {
        if (isPlainObject(info) && typeof info.kid === 'string' && info.expiry_date) {
            const expiry = Date.parse(info.expiry_date);
            if (!Number.isNaN(expiry) && expiry <= now) {
                expired.add(info.kid);
            }
        }
    }
    for (const jwk of list) {
        if (!isPlainObject(jwk) || typeof jwk.kid !== 'string' || !jwk.kid || expired.has(jwk.kid)) {
            continue;
        }
        if (jwk.kty !== 'RSA' || typeof jwk.n !== 'string' || typeof jwk.e !== 'string'
            || !BASE64URL.test(jwk.n) || !BASE64URL.test(jwk.e)) {
            continue;
        }
        if (jwk.alg !== undefined && jwk.alg !== ALGORITHM) {
            continue;
        }
        if (jwk.use !== undefined && jwk.use !== 'sig') {
            continue;
        }
        if (Array.isArray(jwk.key_ops) && !jwk.key_ops.includes('verify')) {
            continue;
        }
        let key;
        try {
            // Only the public members are passed on.
            key = crypto.createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
        } catch (err) {
            continue;
        }
        const details = key.asymmetricKeyDetails || {};
        if (key.asymmetricKeyType !== 'rsa' || !(details.modulusLength >= MIN_MODULUS_BITS)) {
            continue;
        }
        keys.set(jwk.kid, key);
    }
    return keys;
};

/**
 * A cache of the signing keys of one host.
 *
 * RoomPriceGenie keeps up to three keys and rotates one a month. The set is fetched on first use
 * and again when it is older than `ttl`. A token signed with a key that is not in the set triggers
 * one more fetch (the key may be new), but not more often than every `minRefetchInterval`, so
 * tokens with made-up key ids cannot be used to hammer RoomPriceGenie. Concurrent callers share
 * one request. When a refresh fails, the keys already known stay in use.
 * @param {object} options
 * @param {Function} options.fetch async () => the body of GET /integrations/jwk/
 * @param {number} [options.ttl] milliseconds
 * @param {number} [options.minRefetchInterval] milliseconds
 * @param {Function} [options.now] () => milliseconds
 * @returns {{ getKey: Function, refresh: Function }}
 */
const createKeyStore = ({ fetch, ttl = 60 * 60 * 1000, minRefetchInterval = 60 * 1000, now = Date.now }) => {

    let keys = new Map();
    let fetchedAt = 0;
    let attemptedAt = 0;
    let pending = null;

    const load = () => {
        if (!pending) {
            attemptedAt = now();
            pending = (async () => {
                try {
                    const fresh = keysFromJwks(await fetch(), now());
                    if (!fresh.size) {
                        throw new Error('RoomPriceGenie returned no usable signing key.');
                    }
                    keys = fresh;
                    fetchedAt = now();
                } finally {
                    pending = null;
                }
            })();
        }
        return pending;
    };

    return {

        /**
         * @param {string} kid
         * @returns {Promise<crypto.KeyObject|undefined>}
         * @throws {Error} when no key set could be fetched at all
         */
        async getKey(kid) {

            const stale = !fetchedAt || now() - fetchedAt > ttl;
            const mayRefetch = !attemptedAt || now() - attemptedAt >= minRefetchInterval;
            if ((stale || !keys.has(kid)) && (mayRefetch || pending)) {
                try {
                    await load();
                } catch (err) {
                    if (!fetchedAt) {
                        throw err;
                    }
                }
            } else if (!fetchedAt) {
                throw new Error('The RoomPriceGenie signing keys are not available.');
            }
            return keys.get(kid);
        },

        /**
         * Fetch the key set now (a key rotation notice arrived).
         * @returns {Promise<void>}
         */
        async refresh() {

            await load();
        }
    };
};

module.exports = {
    ALGORITHM,
    JwtError,
    parse,
    verify,
    audiences,
    keysFromJwks,
    createKeyStore
};
