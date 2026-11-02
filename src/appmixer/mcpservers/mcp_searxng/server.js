'use strict';

// Stdio MCP server spawned by lib.mcpCall. It replaces the mcp-searxng 0.4.6 npm package
// (MCP SDK 1.10.1; every newer release needs Node 20+ and the ones that still run on Node 18
// carry published advisories) and keeps its tool contract: the same two tools, input schemas
// and response text.
//
// Hardening that the original package lacked (advisories filed against mcp-searxng):
// - web_url_read accepts only http(s) URLs without embedded credentials, resolves the host with
//   dns.lookup and refuses it when ANY resolved address is loopback, private (10/8, 172.16/12,
//   192.168/16), link-local, unique-local, site-local, unspecified, multicast, CGNAT, reserved,
//   or an IPv4-mapped / NAT64 / 6to4 / IPv4-compatible IPv6 form of those
//   (GHSA-q87f-qc2r-2gw4, GHSA-mrvx-jmjw-vggc, GHSA-wppf-h75h-6pm6). The TCP connection is
//   pinned to the address that was validated, so a DNS answer cannot change between the check
//   and the connect. Redirects are not followed by the HTTP client; each hop is re-validated
//   the same way, at most 5 hops.
// - The response body is read as a stream and cut at 1 MiB; the whole read (all hops) is
//   aborted after 30 s (GHSA-xcqx-9jf5-w339).
// - Credentials from SEARXNG_URL, AUTH_USERNAME / AUTH_PASSWORD and the Authorization header
//   never appear in tool error texts or on stderr (GHSA-hjwh-xvfw-qrwj).
// - The SearXNG search request itself is unchanged apart from the optional basic auth
//   (AUTH_USERNAME / AUTH_PASSWORD, or the userinfo part of SEARXNG_URL): the instance is the
//   user's own configured server, so it may legitimately live on a private network.
const dns = require('dns');
const http = require('http');
const https = require('https');
const net = require('net');
const zlib = require('zlib');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { NodeHtmlMarkdown } = require('node-html-markdown');

// The 0.4.6 package reported this version string.
const packageVersion = '0.4.5';

const MAX_BODY_BYTES = 1024 * 1024;
const READ_TIMEOUT_MS = 30000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const WEB_SEARCH_TOOL = {
    name: 'searxng_web_search',
    description: 'Performs a web search using the SearXNG API, ideal for general queries, news, articles, and online content. ' +
        'Use this for broad information gathering, recent events, or when you need diverse web sources.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query. This is the main input for the web search'
            },
            pageno: {
                type: 'number',
                description: 'Search page number (starts at 1)',
                default: 1
            },
            time_range: {
                type: 'string',
                description: 'Time range of search (day, month, year)',
                enum: ['day', 'month', 'year'],
                default: ''
            },
            language: {
                type: 'string',
                description: 'Language code for search results (e.g., \'en\', \'fr\', \'de\'). Default is instance-dependent.',
                default: 'all'
            },
            safesearch: {
                type: 'string',
                description: 'Safe search filter level (0: None, 1: Moderate, 2: Strict)',
                enum: ['0', '1', '2'],
                default: '0'
            }
        },
        required: ['query']
    }
};

const READ_URL_TOOL = {
    name: 'web_url_read',
    description: 'Read the content from an URL. ' +
        'Use this for further information retrieving to understand the content of each URL.',
    inputSchema: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'URL'
            }
        },
        required: ['url']
    }
};

if (!process.env.SEARXNG_URL) {
    console.error('Error: SEARXNG_URL environment variable is required');
    process.exit(1);
}

// Values that must never reach stderr or a tool result.
const SECRETS = [];

function redact(text) {

    let out = String(text);
    SECRETS.forEach(secret => {
        if (secret) {
            out = out.split(secret).join('[redacted]');
        }
    });
    // Any userinfo part of a URL (scheme://user:pass@host).
    return out.replace(/(\w+:\/\/)[^\s/@]+@/g, '$1[redacted]@');
}

function loadSearxngConfig() {

    let base;
    try {
        base = new URL(process.env.SEARXNG_URL);
    } catch (error) {
        console.error('Error: SEARXNG_URL environment variable must be a valid absolute URL');
        process.exit(1);
    }
    let username = process.env.AUTH_USERNAME || '';
    let password = process.env.AUTH_PASSWORD || '';
    if (!username && !password && (base.username || base.password)) {
        username = decodeURIComponent(base.username);
        password = decodeURIComponent(base.password);
    }
    base.username = '';
    base.password = '';
    const headers = {};
    if (username || password) {
        headers.Authorization = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
        SECRETS.push(password, headers.Authorization.slice('Basic '.length));
    }
    return { baseUrl: base.toString().replace(/\/+$/, ''), headers };
}

const searxng = loadSearxngConfig();

function isSearXNGWebSearchArgs(args) {

    return (typeof args === 'object' &&
        args !== null &&
        'query' in args &&
        typeof args.query === 'string');
}

async function performWebSearch(query, pageno = 1, timeRange, language = 'all', safesearch) {

    const url = new URL(`${searxng.baseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('pageno', pageno.toString());
    if (timeRange !== undefined &&
        ['day', 'month', 'year'].includes(timeRange)) {
        url.searchParams.set('time_range', timeRange);
    }
    if (language && language !== 'all') {
        url.searchParams.set('language', language);
    }
    if (safesearch !== undefined && ['0', '1', '2'].includes(safesearch)) {
        url.searchParams.set('safesearch', safesearch);
    }
    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: searxng.headers
    });
    if (!response.ok) {
        throw new Error(`SearXNG API error: ${response.status} ${response.statusText}\n${await response.text()}`);
    }
    const data = await response.json();
    const results = (data.results || []).map((result) => ({
        title: result.title || '',
        content: result.content || '',
        url: result.url || ''
    }));
    return results
        .map((r) => `Title: ${r.title}\nDescription: ${r.content}\nURL: ${r.url}`)
        .join('\n\n');
}

// --- web_url_read: SSRF guard -----------------------------------------------------------

function parseIPv4(text) {

    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
    if (!match) {
        return null;
    }
    const octets = match.slice(1, 5).map(Number);
    return octets.every(octet => octet <= 255) ? octets : null;
}

function isBlockedIPv4(octets) {

    const [a, b] = octets;
    return a === 0                                  // 0.0.0.0/8 ("this" network, unspecified)
        || a === 10                                 // 10/8 private
        || a === 127                                // 127/8 loopback
        || (a === 100 && b >= 64 && b <= 127)       // 100.64/10 CGNAT
        || (a === 169 && b === 254)                 // 169.254/16 link-local, cloud metadata
        || (a === 172 && b >= 16 && b <= 31)        // 172.16/12 private
        || (a === 192 && b === 168)                 // 192.168/16 private
        || a >= 224;                                // 224/4 multicast, 240/4 reserved, broadcast
}

// Expands an IPv6 literal (already accepted by net.isIPv6) into eight 16-bit groups.
function expandIPv6(ip) {

    let text = ip.split('%')[0];
    let tail = [];
    if (text.includes('.')) {
        const idx = text.lastIndexOf(':');
        const octets = parseIPv4(text.slice(idx + 1));
        if (!octets) {
            return null;
        }
        tail = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
        text = text.slice(0, idx + 1);
    }
    const halves = text.split('::');
    if (halves.length > 2) {
        return null;
    }
    const toGroups = part => part.split(':').filter(Boolean).map(group => parseInt(group, 16));
    const head = toGroups(halves[0]);
    const mid = halves.length === 2 ? toGroups(halves[1]) : [];
    const known = head.length + mid.length + tail.length;
    let groups;
    if (halves.length === 2) {
        if (known > 7) {
            return null;
        }
        groups = head.concat(new Array(8 - known).fill(0), mid, tail);
    } else {
        if (known !== 8) {
            return null;
        }
        groups = head.concat(tail);
    }
    return groups.some(Number.isNaN) ? null : groups;
}

function isBlockedIPv6(ip) {

    const g = expandIPv6(ip);
    if (!g) {
        return true;
    }
    const embeddedIPv4 = (hi, lo) => [hi >> 8, hi & 0xff, lo >> 8, lo & 0xff];
    const zeroPrefix = count => g.slice(0, count).every(group => group === 0);

    if (zeroPrefix(7) && (g[7] === 0 || g[7] === 1)) {
        return true;                                            // :: unspecified, ::1 loopback
    }
    if ((g[0] & 0xffc0) === 0xfe80) {
        return true;                                            // fe80::/10 link-local
    }
    if ((g[0] & 0xffc0) === 0xfec0) {
        return true;                                            // fec0::/10 site-local (deprecated)
    }
    if ((g[0] & 0xfe00) === 0xfc00) {
        return true;                                            // fc00::/7 unique-local
    }
    if ((g[0] & 0xff00) === 0xff00) {
        return true;                                            // ff00::/8 multicast
    }
    if (zeroPrefix(5) && g[5] === 0xffff) {
        return isBlockedIPv4(embeddedIPv4(g[6], g[7]));         // ::ffff:a.b.c.d IPv4-mapped
    }
    if (zeroPrefix(6)) {
        return isBlockedIPv4(embeddedIPv4(g[6], g[7]));         // ::a.b.c.d IPv4-compatible (deprecated)
    }
    if (g[0] === 0x0064 && g[1] === 0xff9b && g.slice(2, 6).every(group => group === 0)) {
        return isBlockedIPv4(embeddedIPv4(g[6], g[7]));         // 64:ff9b::/96 NAT64
    }
    if (g[0] === 0x2002) {
        return isBlockedIPv4(embeddedIPv4(g[1], g[2]));         // 2002::/16 6to4
    }
    return false;
}

function isBlockedAddress(address) {

    switch (net.isIP(address)) {
        case 4: {
            const octets = parseIPv4(address);
            return !octets || isBlockedIPv4(octets);
        }
        case 6:
            return isBlockedIPv6(address);
        default:
            return true;
    }
}

// Resolves the hostname and returns one address to connect to; throws when any resolved
// address is non-public. IP literals go through the same path (dns.lookup returns them as is).
async function resolveAllowedAddress(hostname) {

    const host = hostname.replace(/^\[|\]$/g, '');
    const records = await dns.promises.lookup(host, { all: true, verbatim: true });
    if (!records.length) {
        throw new Error(`Could not resolve ${host}`);
    }
    records.forEach(record => {
        if (isBlockedAddress(record.address)) {
            throw new Error(`Refusing to fetch ${host}: it resolves to a private, loopback or otherwise non-public address`);
        }
    });
    return records[0];
}

function parseFetchUrl(raw) {

    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Only http and https URLs are supported');
    }
    if (url.username || url.password) {
        throw new Error('Request cannot be constructed from a URL that includes credentials.');
    }
    return url;
}

// One GET to `url`, connecting to the pre-validated `address`. Redirects are not followed.
// The body is cut at MAX_BODY_BYTES; `signal` aborts the request.
function requestOnce(url, { address, family }, signal) {

    return new Promise((resolve, reject) => {
        const transport = url.protocol === 'https:' ? https : http;
        const req = transport.request(url, {
            method: 'GET',
            headers: {
                'User-Agent': `mcp-searxng/${packageVersion}`,
                'Accept': '*/*'
            },
            signal,
            // Pin the TCP connection to the address that passed the SSRF check.
            lookup: (host, options, callback) => {
                if (options && options.all) {
                    return callback(null, [{ address, family }]);
                }
                return callback(null, address, family);
            }
        });
        let settled = false;
        const settle = (fn, value) => {
            if (!settled) {
                settled = true;
                fn(value);
            }
        };
        req.on('error', error => settle(reject, error));
        req.on('response', res => {
            const { statusCode, statusMessage, headers } = res;
            if (REDIRECT_STATUSES.has(statusCode) && headers.location) {
                res.resume();
                return settle(resolve, { statusCode, statusMessage, headers });
            }
            let stream = res;
            const encoding = (headers['content-encoding'] || '').trim().toLowerCase();
            if (encoding === 'gzip' || encoding === 'x-gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            } else if (encoding === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            }
            const chunks = [];
            let received = 0;
            let truncated = false;
            stream.on('data', chunk => {
                if (truncated) {
                    return;
                }
                const room = MAX_BODY_BYTES - received;
                if (chunk.length >= room) {
                    chunks.push(chunk.subarray(0, room));
                    received += room;
                    truncated = true;
                    settle(resolve, { statusCode, statusMessage, headers, body: Buffer.concat(chunks), truncated });
                    req.destroy();
                    return;
                }
                chunks.push(chunk);
                received += chunk.length;
            });
            stream.on('error', error => settle(reject, error));
            stream.on('end', () => settle(resolve, { statusCode, statusMessage, headers, body: Buffer.concat(chunks), truncated }));
        });
        req.end();
    });
}

async function fetchAndConvertToMarkdown(rawUrl, timeoutMs = READ_TIMEOUT_MS) {

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        let url = parseFetchUrl(rawUrl);
        for (let hop = 0; ; hop++) {
            const target = await resolveAllowedAddress(url.hostname);
            const response = await requestOnce(url, target, controller.signal);
            if (REDIRECT_STATUSES.has(response.statusCode) && response.headers.location) {
                if (hop >= MAX_REDIRECTS) {
                    throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`);
                }
                url = parseFetchUrl(new URL(response.headers.location, url).toString());
                continue;
            }
            if (response.statusCode < 200 || response.statusCode >= 300) {
                throw new Error(`Failed to fetch the URL: ${response.statusMessage}`);
            }
            let markdown = NodeHtmlMarkdown.translate(response.body.toString('utf8'));
            if (response.truncated) {
                markdown += `\n\n[Content truncated: the response exceeded ${MAX_BODY_BYTES} bytes]`;
            }
            return markdown;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        console.error('Error:', redact(error.message));
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

// --- MCP server -------------------------------------------------------------------------

const server = new Server(
    { name: 'ihor-sokoliuk/mcp-searxng', version: packageVersion },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [WEB_SEARCH_TOOL, READ_URL_TOOL]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {

    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error('No arguments provided');
        }
        if (name === 'searxng_web_search') {
            if (!isSearXNGWebSearchArgs(args)) {
                throw new Error('Invalid arguments for searxng_web_search');
            }
            const { query, pageno = 1, time_range: timeRange, language = 'all', safesearch } = args;
            const results = await performWebSearch(query, pageno, timeRange, language, safesearch);
            return {
                content: [{ type: 'text', text: results }],
                isError: false
            };
        }
        if (name === 'web_url_read') {
            const { url } = args;
            const result = await fetchAndConvertToMarkdown(url);
            return {
                content: [{ type: 'text', text: result }],
                isError: false
            };
        }
        return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: redact(`Error: ${error instanceof Error ? error.message : String(error)}`)
            }],
            isError: true
        };
    }
});

server.connect(new StdioServerTransport())
    .catch((error) => {
        // stdout is the MCP channel; diagnostics go to stderr.
        console.error('Fatal error running server:', redact(error && error.message ? error.message : error));
        process.exit(1);
    });
