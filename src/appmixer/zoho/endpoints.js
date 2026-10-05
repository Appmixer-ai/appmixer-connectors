'use strict';
const check = require('check-types');

// Zoho data centers, keyed by the `location` code Zoho sends in the OAuth redirect callback.
// The accounts server and the API host do not always share a TLD (Canada: accounts.zohocloud.ca
// vs. www.zohoapis.ca), so both are listed explicitly.
// See https://www.zoho.com/accounts/protocol/oauth/multi-dc.html
const DATA_CENTERS = {
    'us': { accounts: 'https://accounts.zoho.com', api: 'https://www.zohoapis.com' },
    'eu': { accounts: 'https://accounts.zoho.eu', api: 'https://www.zohoapis.eu' },
    'in': { accounts: 'https://accounts.zoho.in', api: 'https://www.zohoapis.in' },
    'au': { accounts: 'https://accounts.zoho.com.au', api: 'https://www.zohoapis.com.au' },
    'cn': { accounts: 'https://accounts.zoho.com.cn', api: 'https://www.zohoapis.com.cn' },
    'jp': { accounts: 'https://accounts.zoho.jp', api: 'https://www.zohoapis.jp' },
    'ca': { accounts: 'https://accounts.zohocloud.ca', api: 'https://www.zohoapis.ca' },
    'sa': { accounts: 'https://accounts.zoho.sa', api: 'https://www.zohoapis.sa' },
    'uk': { accounts: 'https://accounts.zoho.uk', api: 'https://www.zohoapis.uk' }
};

const ACCOUNTS_SERVERS = new Set(Object.values(DATA_CENTERS).map(dc => dc.accounts));
const API_DOMAINS = new Set(Object.values(DATA_CENTERS).map(dc => dc.api));

/**
 * Data center of a region. An unknown region fails loudly: falling back to the US data center
 * sends the token or the API request to a server that does not know the account and the only
 * symptom is "Invalid access token".
 * @param {String} region
 * @returns {{ accounts: String, api: String }}
 */
const getDataCenter = region => {

    check.assert.string(region, `Missing region: ${region}.`);
    const dataCenter = DATA_CENTERS[region.toLowerCase()];
    if (!dataCenter) {
        throw new Error(`Unsupported Zoho data center: ${region}.`);
    }
    return dataCenter;
};

/**
 * Zoho Data Center specific account endpoint.
 * @param {String} region
 * @returns {String}
 */
const accountsEndpoint = region => getDataCenter(region).accounts;

/**
 * Zoho Data Center specific API endpoint.
 * @param {String} region
 * @returns {String}
 */
const apiEndpoint = region => getDataCenter(region).api;

/**
 * Normalizes a server URL Zoho handed over (`accounts-server` from the redirect callback,
 * `api_domain` from the token response) and accepts it only when it is a known Zoho host.
 * The access token and the client secret are sent there, so an arbitrary host is never trusted.
 * @param {String} [url]
 * @param {Set<String>} allowed
 * @returns {String|null}
 */
const trustedServer = (url, allowed) => {

    if (typeof url !== 'string' || !url) {
        return null;
    }
    const normalized = url.trim().replace(/\/+$/, '').toLowerCase();
    return allowed.has(normalized) ? normalized : null;
};

/**
 * Accounts server of an account: the `accounts-server` Zoho named in the redirect callback,
 * falling back to the region for accounts connected before it was stored.
 * @param {{ accountsServer?: String, region?: String }} [dataCenter]
 * @returns {String}
 */
const resolveAccountsServer = ({ accountsServer, region } = {}) => {

    return trustedServer(accountsServer, ACCOUNTS_SERVERS) || accountsEndpoint(region);
};

/**
 * API host of an account: the `api_domain` from the token response, falling back to the region
 * for accounts connected before it was stored.
 * @param {{ apiDomain?: String, region?: String }} [dataCenter]
 * @returns {String}
 */
const resolveApiDomain = ({ apiDomain, region } = {}) => {

    return trustedServer(apiDomain, API_DOMAINS) || apiEndpoint(region);
};

module.exports = {
    resolveAccountsServer,
    resolveApiDomain,
    trustedAccountsServer: url => trustedServer(url, ACCOUNTS_SERVERS),
    trustedApiDomain: url => trustedServer(url, API_DOMAINS)
};
