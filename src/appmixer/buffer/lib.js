'use strict';

const crypto = require('crypto');
const pathModule = require('path');

const API_BASE_URL = 'https://api.buffer.com';
const DEFAULT_PREFIX = 'buffer-objects-export';

// Buffer returns up to 100 items per page.
const PAGE_SIZE = 100;

// GraphQL selections, one per entity, shared by every component that returns it.
const POST_FIELDS = `
    id
    text
    status
    channelId
    channelService
    dueAt
    sentAt
    createdAt
    updatedAt
    shareMode
    schedulingType
    isCustomScheduled
    sharedNow
    externalLink
    ideaId
    via
    error { message }
    tags { id name color }
    assets { id type mimeType source thumbnail }
`;

const CHANNEL_FIELDS = `
    id
    name
    displayName
    service
    type
    descriptor
    avatar
    organizationId
    timezone
    isDisconnected
    isLocked
    isQueuePaused
    externalLink
    createdAt
    updatedAt
`;

const IDEA_FIELDS = `
    id
    organizationId
    groupId
    createdAt
    updatedAt
    content { title text }
`;

const TYPENAME = '__typename';

// GraphQL error codes that retrying cannot fix.
const CANCEL_CODES = ['NOT_FOUND', 'FORBIDDEN', 'BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED'];

const cancelError = (context, message) => {

    return context.CancelError ? new context.CancelError(message) : new Error(message);
};

/**
 * The one place that turns a connected account into request headers.
 * Components read the token from context.auth, auth.js callbacks from context.accessToken.
 * @param {object} context
 * @returns {object}
 */
const authHeaders = (context) => {

    const token = context.auth && context.auth.accessToken ? context.auth.accessToken : context.accessToken;
    return { 'Authorization': `Bearer ${token}` };
};

/**
 * Run a GraphQL operation against https://api.buffer.com.
 * Buffer answers HTTP 200 with an `errors` array for query-level failures, so they are
 * turned into exceptions here (non-recoverable codes into CancelError).
 * @param {object} context
 * @param {string} query
 * @param {object} [variables]
 * @returns {Promise<object>} the `data` object
 */
const graphql = async (context, query, variables) => {

    const { data: body } = await context.httpRequest({
        method: 'POST',
        url: API_BASE_URL,
        headers: authHeaders(context),
        data: variables ? { query, variables } : { query }
    });

    if (body && Array.isArray(body.errors) && body.errors.length) {
        const message = body.errors.map(err => {
            const code = err.extensions && err.extensions.code;
            return code ? `${code}: ${err.message}` : err.message;
        }).join('; ');
        const cancel = body.errors.some(err => err.extensions && CANCEL_CODES.includes(err.extensions.code));
        throw cancel ? cancelError(context, `Buffer API error: ${message}`) : new Error(`Buffer API error: ${message}`);
    }

    if (!body || !body.data) {
        throw new Error('Buffer API returned no data.');
    }
    return body.data;
};

/**
 * Mutations answer with a union: the success type or a MutationError carrying `message`.
 * Every mutation selects `__typename`, so anything other than the expected success type is
 * an error the user has to fix (invalid input, not found, limit reached).
 * @param {object} context
 * @param {object} payload the mutation field of the response
 * @param {string[]} successTypes
 * @returns {object}
 */
const mutationResult = (context, payload, successTypes) => {

    if (!payload) {
        throw new Error('Buffer API returned an empty mutation response.');
    }
    const typename = payload[TYPENAME];
    if (!successTypes.includes(typename)) {
        const type = typename ? `${typename}: ` : '';
        throw cancelError(context, `Buffer: ${type}${payload.message || 'the request was rejected.'}`);
    }
    return payload;
};

const mapPost = (post) => {

    const { error, tags, assets, ...rest } = post;
    return {
        ...rest,
        errorMessage: error ? error.message : null,
        tags: tags || [],
        assets: assets || []
    };
};

const mapIdea = (idea) => {

    const content = idea.content || {};
    return {
        id: idea.id,
        organizationId: idea.organizationId,
        groupId: idea.groupId,
        title: content.title,
        text: content.text,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt
    };
};

/**
 * One page of posts.
 * @param {object} context
 * @param {object} options { organizationId, filter, sort, first, after }
 * @returns {Promise<{posts: object[], pageInfo: object}>}
 */
const fetchPostsPage = async (context, { organizationId, filter, sort, first = PAGE_SIZE, after }) => {

    const query = `query Posts($first: Int, $after: String, $input: PostsInput!) {
        posts(first: $first, after: $after, input: $input) {
            edges { node { ${POST_FIELDS} } }
            pageInfo { hasNextPage endCursor }
        }
    }`;
    const input = { organizationId };
    if (filter && Object.keys(filter).length) {
        input.filter = filter;
    }
    if (sort) {
        input.sort = sort;
    }
    const variables = { first, input };
    if (after) {
        variables.after = after;
    }
    const data = await graphql(context, query, variables);
    const result = data.posts || {};
    return {
        posts: (result.edges || []).map(edge => mapPost(edge.node)),
        pageInfo: result.pageInfo || { hasNextPage: false }
    };
};

const getCacheKey = (obj) => {

    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
};

/**
 * Cache the result of fn() for dynamic inspector sources. The designer fires source calls in
 * concurrent bursts; the lock lets the first call fill the cache for the rest.
 * @param {object} context
 * @param {object} keyParts every input that shapes the result
 * @param {Function} fn
 * @returns {Promise<*>}
 */
const callCached = async (context, keyParts, fn) => {

    const key = 'buffer-' + getCacheKey({ ...keyParts, token: context.auth.accessToken });
    let lock;
    try {
        lock = await context.lock(key);
        const cached = await context.staticCache.get(key);
        if (cached) {
            return cached;
        }
        const value = await fn();
        await context.staticCache.set(key, value, context.config.listCacheTTL || (2 * 60 * 1000));
        return value;
    } finally {
        lock && await lock.unlock();
    }
};

const listOrganizations = async (context) => {

    const data = await graphql(context, 'query Organizations { account { organizations { id name ownerEmail channelCount } } }');
    return (data.account && data.account.organizations) || [];
};

/**
 * Channels of one organization, or of every organization of the account when none is given.
 * @param {object} context
 * @param {string} [organizationId]
 * @returns {Promise<object[]>}
 */
const listChannels = async (context, organizationId) => {

    const query = `query Channels($input: ChannelsInput!) { channels(input: $input) { ${CHANNEL_FIELDS} } }`;
    const organizationIds = organizationId
        ? [organizationId]
        : (await listOrganizations(context)).map(org => org.id);

    const channels = [];
    for (const id of organizationIds) {
        const data = await graphql(context, query, { input: { organizationId: id } });
        channels.push(...(data.channels || []));
    }
    return channels;
};

/**
 * Parse a list of URLs typed as comma or newline separated text (or mapped as an array).
 * @param {string|string[]} value
 * @returns {string[]}
 */
const parseUrlList = (value) => {

    if (!value) {
        return [];
    }
    const items = Array.isArray(value) ? value : String(value).split(/[,\n]/);
    return items.map(item => String(item).trim()).filter(Boolean);
};

const toIsoDate = (context, value, label) => {

    if (!value) {
        return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw cancelError(context, `${label} is not a valid date.`);
    }
    return date.toISOString();
};

// Polling triggers ------------------------------------------------------------------------

const DEFAULT_POLL_INTERVAL_MINUTES = 15;
const MAX_POLL_PAGES = 5;

const latestTime = (post, fields) => {

    return Math.max(...fields.map(field => (post[field] ? new Date(post[field]).getTime() : 0)));
};

/**
 * Shared polling loop of the NewPost and PostSent triggers.
 *
 * Buffer has no webhooks. Each poll asks only for posts in a time window (the docs' "poll
 * narrowly" advice) and pages through it newest first. The window starts at now - lookback, so
 * every post that can still enter the results is in it (clamped to the flow start when the
 * filtered date cannot be older than the event, as for createdAt). Only posts whose newest
 * timestamp is not older than the flow start fire.
 * Seen post IDs are remembered with their newest timestamp and forgotten once they fall out of
 * the window, so an empty or partial answer never wipes the state and never re-fires old posts.
 * Requests are rationed by the Polling Interval property because Buffer's app client quota is
 * small (500 requests per 24 hours plus 25 per authorized user).
 *
 * @param {object} context
 * @param {object} options
 * @param {function(Date): object} options.buildFilter posts filter for a window start
 * @param {string} options.sortField createdAt | dueAt
 * @param {string[]} options.timeFields post fields whose newest value orders the post in time
 * @param {number} options.lookbackMs minimum window length
 * @param {boolean} [options.clampToSince] never look before the flow start
 * @returns {Promise<object[]>} new posts, oldest first
 */
const pollPosts = async (context, { buildFilter, sortField, timeFields, lookbackMs, clampToSince }) => {

    const { channelId, pollInterval } = context.properties;
    const state = await context.loadState() || {};
    const organizationId = context.properties.organizationId || state.organizationId;
    const now = Date.now();
    const intervalMs = (Number(pollInterval) || DEFAULT_POLL_INTERVAL_MINUTES) * 60 * 1000;

    if (!state.since || !organizationId) {
        // start() did not run: begin from now, nothing before it is new.
        await startPolling(context);
        return [];
    }
    // Ticks come every minute or so; poll only once the interval has passed (small tolerance).
    if (state.lastPollAt && now - state.lastPollAt < intervalMs - 10 * 1000) {
        return [];
    }

    const since = new Date(state.since).getTime();
    const lookbackStart = now - Math.max(lookbackMs, 3 * intervalMs);
    const windowStart = clampToSince ? Math.max(since, lookbackStart) : lookbackStart;
    const filter = buildFilter(new Date(windowStart));
    if (channelId) {
        filter.channelIds = [channelId];
    }
    const sort = [{ field: sortField, direction: 'desc' }];

    const posts = [];
    let after;
    let truncated = false;
    for (let page = 0; page < MAX_POLL_PAGES; page++) {
        const result = await fetchPostsPage(context, { organizationId, filter, sort, after });
        posts.push(...result.posts);
        if (!result.pageInfo.hasNextPage || !result.pageInfo.endCursor) {
            break;
        }
        after = result.pageInfo.endCursor;
        truncated = page === MAX_POLL_PAGES - 1;
    }
    if (truncated) {
        await context.log({ step: 'Buffer poll truncated', read: posts.length });
    }

    const known = state.known || {};
    const newPosts = posts.filter(post => !known[post.id] && latestTime(post, timeFields) >= since);

    const nextKnown = {};
    for (const [id, time] of Object.entries(known)) {
        if (time >= windowStart) {
            nextKnown[id] = time;
        }
    }
    for (const post of posts) {
        nextKnown[post.id] = latestTime(post, ['createdAt', 'dueAt', 'sentAt']);
    }

    await context.saveState({ ...state, known: nextKnown, lastPollAt: now });
    return newPosts.reverse();
};

/**
 * The organization a trigger polls: the selected one, or the account's first organization
 * (most accounts have exactly one).
 * @param {object} context
 * @returns {Promise<string>}
 */
const resolveTriggerOrganization = async (context) => {

    if (context.properties.organizationId) {
        return context.properties.organizationId;
    }
    const organizations = await listOrganizations(context);
    if (!organizations.length) {
        throw new context.CancelError('The Buffer account has no organization.');
    }
    return organizations[0].id;
};

/**
 * Persist the start of the polling window (and the polled organization) when the flow starts.
 * @param {object} context
 */
const startPolling = async (context) => {

    const organizationId = await resolveTriggerOrganization(context);
    return context.saveState({ since: new Date().toISOString(), organizationId, known: {}, lastPollAt: null });
};

// MakeApiCall helpers -----------------------------------------------------------------------

/**
 * Resolve a user supplied endpoint (relative path or absolute URL) against the API base and
 * refuse anything that would send the account's credential somewhere else.
 * @param {object} context
 * @param {string} url
 * @returns {string}
 */
const resolveApiUrl = (context, url) => {

    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')
        ? url
        : `${url.startsWith('/') ? '' : '/'}${url}`;

    let parsed;
    try {
        parsed = new URL(candidate, API_BASE_URL);
    } catch (error) {
        throw new context.CancelError(`API Endpoint Path is not a valid URL: ${url}`);
    }

    if (parsed.username || parsed.password) {
        throw new context.CancelError('API Endpoint Path must not contain credentials.');
    }

    if (parsed.origin !== API_BASE_URL) {
        throw new context.CancelError(`API Endpoint Path must target ${API_BASE_URL}, got ${parsed.origin}.`);
    }

    return parsed.toString();
};

/**
 * Parse a textarea JSON input. Empty input means "no body"; an object is passed through.
 * @param {object} context
 * @param {string|object} value
 * @param {string} label
 * @returns {object|undefined}
 */
const parseJsonInput = (context, value, label) => {

    if (value === null || value === undefined || value === '') {
        return undefined;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        throw new context.CancelError(`${label} must be valid JSON.`);
    }
};

/**
 * Convert a key-value inspector input into a plain object. The Designer stores the rows as
 * the JSON string of an object; a plain object and an array of {key, value} rows are accepted too.
 * @param {string|object|Array<{key: string, value: *}>} value
 * @returns {object}
 */
const kvToObject = (value) => {

    let input = value;
    if (typeof input === 'string') {
        if (!input.trim()) {
            return {};
        }
        try {
            input = JSON.parse(input);
        } catch (error) {
            throw new Error('Request Headers and Query Parameters must be a JSON object of key-value pairs.');
        }
    }
    if (!input || typeof input !== 'object') {
        return {};
    }
    const entries = Array.isArray(input)
        ? input.filter(row => row && typeof row === 'object').map(row => [row.key, row.value])
        : Object.entries(input);
    const result = {};
    for (const [key, val] of entries) {
        if (typeof key !== 'string' || !key) {
            continue;
        }
        result[key] = val;
    }
    return result;
};

// outputType helpers ------------------------------------------------------------------------

// One CSV cell per RFC 4180: null/undefined → empty, objects → JSON, and a value
// holding a comma, a double quote or a line break is quoted with inner quotes doubled.
const csvCell = (value) => {
    if (value == null) return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
};

const toCsv = (records) => {
    // An empty result set is ordinary (new account, filter matches nothing): an empty file, not a crash.
    if (!records.length) return '';
    // Cells are taken by header column, not Object.values(record), so a record with
    // a different key order or a missing key stays under the right header.
    const columns = Object.keys(records[0]);
    const rows = records.map(record => columns.map(column => csvCell(record[column])).join(','));
    return [columns.map(csvCell).join(','), ...rows].join('\n');
};

module.exports = {

    API_BASE_URL,
    PAGE_SIZE,
    POST_FIELDS,
    CHANNEL_FIELDS,
    IDEA_FIELDS,

    authHeaders,
    graphql,
    TYPENAME,
    mutationResult,
    mapPost,
    mapIdea,
    fetchPostsPage,
    callCached,
    listOrganizations,
    listChannels,
    parseUrlList,
    toIsoDate,
    pollPosts,
    startPolling,
    resolveTriggerOrganization,
    resolveApiUrl,
    parseJsonInput,
    kvToObject,
    toCsv,

    async sendArrayOutput({
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
    },

    getOutputPortOptions(context, outputType, itemSchema, { label, value }) {
        if (outputType === 'object' || outputType === 'first') {
            const options = Object.keys(itemSchema)
                .reduce((res, field) => {
                    const schema = itemSchema[field];
                    const { title: label, ...schemaWithoutTitle } = schema;
                    res.push({ label, value: field, schema: schemaWithoutTitle });
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
};
