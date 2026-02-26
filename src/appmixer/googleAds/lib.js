'use strict';

const crypto = require('crypto');

const API_BASE_URL = 'https://googleads.googleapis.com/v23';

function ensureRequired(value, message, context) {
    if (value === undefined || value === null || value === '') {
        throw new context.CancelError(message);
    }
}

function normalizeCustomerId(customerId) {
    return String(customerId || '').replace(/[^0-9]/g, '');
}

function buildHeaders(context, { developerToken, loginCustomerId }) {
    const headers = {
        'Authorization': `Bearer ${context.auth.accessToken}`,
        'developer-token': developerToken
    };

    if (loginCustomerId) {
        headers['login-customer-id'] = normalizeCustomerId(loginCustomerId);
    }

    return headers;
}

async function searchStream(context, {
    customerId,
    developerToken,
    loginCustomerId,
    query
}) {
    const normalizedCustomerId = normalizeCustomerId(customerId);
    const headers = buildHeaders(context, { developerToken, loginCustomerId });

    const { data } = await context.httpRequest({
        method: 'POST',
        url: `${API_BASE_URL}/customers/${normalizedCustomerId}/googleAds:searchStream`,
        headers,
        data: { query }
    });

    const chunks = Array.isArray(data) ? data : [data];
    return chunks.reduce((result, chunk) => {
        if (Array.isArray(chunk.results)) {
            result.push(...chunk.results);
        }
        return result;
    }, []);
}

function hashSha256(value) {
    return crypto
        .createHash('sha256')
        .update(String(value || '').trim().toLowerCase(), 'utf8')
        .digest('hex');
}

function getOfflineUserDataJobIdFromResourceName(resourceName) {
    const match = String(resourceName || '').match(/offlineUserDataJobs\/(\d+)/);
    return match ? match[1] : null;
}

module.exports = {
    ensureRequired,
    normalizeCustomerId,
    buildHeaders,
    searchStream,
    hashSha256,
    getOfflineUserDataJobIdFromResourceName,
    API_BASE_URL
};
